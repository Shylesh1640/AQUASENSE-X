"""Core simulation engine for AQUASENSE-X.

Orchestrates sensor simulation, treatment modeling, filter degradation,
output verification, safety checks, and data persistence.
"""

from __future__ import annotations

import asyncio
import enum
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional

import numpy as np

from ..simulation.fault_injection import FaultInjector, TreatmentStage
from ..simulation.scenarios import ScenarioConfig, ScenarioType, ScheduledEvent, get_scenario
from ..simulation.sensor_models import (
    FaultType,
    SensorModel,
    SensorType,
    create_all_sensors,
)


class SimulationState(str, enum.Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"


class VerificationStatus(str, enum.Enum):
    VERIFIED = "verified"
    WARNING = "warning"
    FAILED = "failed"
    UNAVAILABLE = "unavailable"


class SafetyStatus(str, enum.Enum):
    SAFE = "safe"
    WARNING = "warning"
    UNSAFE = "unsafe"


@dataclass
class VerificationResult:
    status: VerificationStatus
    outlet_tds: float
    outlet_ph: float
    outlet_turbidity: float
    outlet_temperature: float
    inlet_tds: float
    inlet_ph: float
    inlet_turbidity: float
    reduction_tds_pct: float
    reduction_turbidity_pct: float
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    messages: list[str] = field(default_factory=list)


@dataclass
class SafetyCheckResult:
    status: SafetyStatus
    dispensing_allowed: bool
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    reasons: list[str] = field(default_factory=list)


@dataclass
class FilterState:
    stage: TreatmentStage
    health_pct: float = 100.0
    litres_processed: float = 0.0
    operating_hours: float = 0.0
    installation_date: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_life_hours: float = 2000.0
    estimated_life_litres: float = 10000.0


@dataclass
class RecoveryData:
    feed_litres: float = 0.0
    permeate_litres: float = 0.0
    reject_litres: float = 0.0
    recovery_ratio_pct: float = 0.0
    reject_reuse_pct: float = 50.0


# ---------------------------------------------------------------------------
# Main simulation engine
# ---------------------------------------------------------------------------

class SimulationEngine:
    """Central simulation controller."""

    def __init__(self, config: dict, db_session_factory: Optional[Callable] = None) -> None:
        self.config = config
        self.db_session_factory = db_session_factory

        self.state = SimulationState.STOPPED
        self.sensors: dict[SensorType, SensorModel] = {}
        self.scenario: Optional[ScenarioConfig] = None
        self.fault_injector = FaultInjector()

        self.speed_multiplier: float = 1.0
        self.seed: Optional[int] = None
        self.rng: Optional[np.random.Generator] = None

        self._worker_task: Optional[asyncio.Task] = None
        self._tick_count: int = 0
        self._elapsed_seconds: float = 0.0
        self._start_time: Optional[datetime] = None
        self._pause_elapsed: float = 0.0

        self._current_readings: dict[str, float] = {}
        self._treatment_state: dict[str, Any] = {}
        self._filter_states: dict[TreatmentStage, FilterState] = {}
        self._recovery_data = RecoveryData()
        self._verification_result: Optional[VerificationResult] = None
        self._safety_result: Optional[SafetyCheckResult] = None

        self._listeners: list[Callable[[dict], Any]] = []
        self._executed_events: set[float] = set()

        self._init_filter_states()

    # -- Lifecycle -----------------------------------------------------------

    async def start(
        self,
        scenario_type: ScenarioType = ScenarioType.NORMAL,
        seed: Optional[int] = None,
        speed: float = 1.0,
        custom_scenario_params: Optional[dict] = None,
    ) -> None:
        if self.state not in (SimulationState.STOPPED,):
            raise RuntimeError(f"Cannot start from state {self.state}")

        self.state = SimulationState.STARTING
        try:
            self.scenario = get_scenario(scenario_type, custom_scenario_params)
            self.speed_multiplier = speed
            self.seed = seed if seed is not None else np.random.randint(0, 2**31)
            self.rng = np.random.default_rng(self.seed)

            self._reset_state()
            self._init_sensors()
            self._start_time = datetime.now(timezone.utc)

            self._worker_task = asyncio.create_task(self._simulation_loop())
            self.state = SimulationState.RUNNING
        except Exception:
            self.state = SimulationState.STOPPED
            raise

    async def pause(self) -> None:
        if self.state != SimulationState.RUNNING:
            raise RuntimeError(f"Cannot pause from state {self.state}")
        self.state = SimulationState.PAUSED
        self._pause_elapsed = self._elapsed_seconds

    async def resume(self) -> None:
        if self.state != SimulationState.PAUSED:
            raise RuntimeError(f"Cannot resume from state {self.state}")
        self.state = SimulationState.RUNNING

    async def stop(self) -> None:
        if self.state == SimulationState.STOPPED:
            return

        self.state = SimulationState.STOPPING
        if self._worker_task is not None:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None
        self.state = SimulationState.STOPPED

    async def reset(self) -> None:
        await self.stop()
        self._reset_state()

    def set_speed(self, multiplier: float) -> None:
        if multiplier <= 0 or multiplier > 10:
            raise ValueError("Speed multiplier must be in (0, 10]")
        self.speed_multiplier = multiplier

    def adjust_sensor(self, sensor_type: SensorType, value: float) -> None:
        sensor = self.sensors.get(sensor_type)
        if sensor:
            sensor.set_manual_override(value)

    def clear_sensor_override(self, sensor_type: SensorType) -> None:
        sensor = self.sensors.get(sensor_type)
        if sensor:
            sensor.set_manual_override(None)

    # -- Main simulation loop ------------------------------------------------

    async def _simulation_loop(self) -> None:
        tick_interval_s = self.config.get("tick_interval_seconds", 1.0)
        db_write_every_n_ticks = self.config.get("db_write_every_n_ticks", 5)

        try:
            while self.state in (SimulationState.RUNNING, SimulationState.PAUSED):
                if self.state == SimulationState.PAUSED:
                    await asyncio.sleep(0.5)
                    continue

                loop_start = asyncio.get_event_loop().time()

                # Process scheduled events
                self._process_scheduled_events()

                # 1. Generate sensor readings
                readings = self._generate_readings()
                self._current_readings = readings

                # 2. Run treatment simulation
                treatment_output = self._simulate_treatment(readings)
                self._treatment_state = treatment_output

                # 3. Calculate filter degradation
                self._calculate_filter_degradation()

                # 4. Run output verification
                self._verification_result = self._verify_output(treatment_output, readings)

                # 5. Check safety conditions
                self._safety_result = self._check_safety()

                # 6. Calculate RO recovery
                self._calculate_recovery(readings.get("flow", 0.0))

                # 7. Store to DB periodically
                if self._tick_count % db_write_every_n_ticks == 0:
                    await self._persist_to_db()

                # 8. Broadcast to listeners
                await self._broadcast_state()

                # Advance time
                self._tick_count += 1
                self._elapsed_seconds += tick_interval_s * self.speed_multiplier

                # Sleep to maintain tick rate
                elapsed = asyncio.get_event_loop().time() - loop_start
                sleep_time = max(0.01, tick_interval_s / self.speed_multiplier - elapsed)
                await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            pass

    def _process_scheduled_events(self) -> None:
        if not self.scenario:
            return

        for event in self.scenario.events:
            if event.trigger_seconds in self._executed_events:
                continue
            if self._elapsed_seconds >= event.trigger_seconds:
                self._executed_events.add(event.trigger_seconds)
                self.scenario.sensor_params.update(event.param_overrides)
                if event.fault_injection:
                    st_str = event.fault_injection.get("sensor_type")
                    ft_str = event.fault_injection.get("fault_type")
                    if st_str and ft_str:
                        sensor_type = SensorType(st_str)
                        fault_type = FaultType(ft_str)
                        sensor = self.sensors.get(sensor_type)
                        if sensor:
                            sensor.inject_fault(fault_type, self._elapsed_seconds)

    # -- Sensor generation ---------------------------------------------------

    def _generate_readings(self) -> dict[str, float]:
        if not self.scenario:
            return {}

        context: dict[str, Any] = {
            "avg_filter_health": self._avg_filter_health(),
        }

        readings: dict[str, float] = {}
        for sensor_type, sensor in self.sensors.items():
            value = sensor.generate(
                self._elapsed_seconds,
                self.scenario.sensor_params,
                self.rng,
                context=context,
            )
            readings[sensor_type.value] = value

            # Update context for cross-sensor correlations
            if sensor_type == SensorType.TEMPERATURE:
                context["temperature"] = value
            elif sensor_type == SensorType.TDS:
                context["tds"] = value
            elif sensor_type == SensorType.PRESSURE:
                context["pressure"] = value

        # Apply fault injector overrides
        sensor_faults = self.fault_injector.get_sensor_faults()
        for st, fault in sensor_faults.items():
            if st in self.sensors:
                ft = fault.params.get("fault_type")
                if ft and ft != FaultType.NONE:
                    self.sensors[st].inject_fault(ft, self._elapsed_seconds, **fault.params)

        if self.fault_injector.has_pressure_fault():
            params = self.fault_injector.get_pressure_fault_params()
            if params:
                target = params.get("target_pressure", 0.5)
                readings["pressure"] = target

        if self.fault_injector.has_flow_fault():
            params = self.fault_injector.get_flow_fault_params()
            if params:
                target = params.get("target_flow", 0.0)
                readings["flow"] = target

        return readings

    # -- Treatment simulation ------------------------------------------------

    def _simulate_treatment(self, inlet_readings: dict) -> dict:
        tds_in = inlet_readings.get("tds", 300.0)
        turb_in = inlet_readings.get("turbidity", 1.0)
        ph_in = inlet_readings.get("ph", 7.0)
        temp_in = inlet_readings.get("temperature", 25.0)

        failed_stages = self.fault_injector.get_treatment_faults()

        # Sediment filter
        if TreatmentStage.SEDIMENT not in failed_stages:
            health = self._filter_states[TreatmentStage.SEDIMENT].health_pct / 100.0
            turb_in *= (1.0 - 0.5 * health)  # reduces turbidity by up to 50%
        else:
            turb_in *= 0.95  # minimal reduction if failed

        # Activated carbon
        if TreatmentStage.CARBON not in failed_stages:
            health = self._filter_states[TreatmentStage.CARBON].health_pct / 100.0
            turb_in *= (1.0 - 0.2 * health)
        else:
            turb_in *= 0.98

        # UF membrane
        if TreatmentStage.UF not in failed_stages:
            health = self._filter_states[TreatmentStage.UF].health_pct / 100.0
            turb_in *= (1.0 - 0.9 * health)
            tds_in *= (1.0 - 0.075 * health)
        else:
            turb_in *= 0.85
            tds_in *= 0.95

        # RO membrane
        if TreatmentStage.RO not in failed_stages:
            health = self._filter_states[TreatmentStage.RO].health_pct / 100.0
            tds_in *= (1.0 - 0.90 * health)
            turb_in = max(0.1, turb_in * (1.0 - 0.95 * health))
        else:
            tds_in *= 0.7
            turb_in *= 0.6

        # UV (no TDS/turbidity effect, just operational status)
        uv_operational = TreatmentStage.UV not in failed_stages

        # Remineralization
        if TreatmentStage.REMINERALIZATION not in failed_stages:
            tds_in += 30.0  # adds minerals back

        return {
            "outlet_tds": max(0.0, tds_in),
            "outlet_turbidity": max(0.0, turb_in),
            "outlet_ph": ph_in,  # simplified: pH changes minimal after RO
            "outlet_temperature": temp_in,
            "uv_operational": uv_operational,
        }

    # -- Filter degradation --------------------------------------------------

    def _calculate_filter_degradation(self) -> None:
        if not self.scenario:
            return

        tick_interval_s = self.config.get("tick_interval_seconds", 1.0)
        flow_lpm = self._current_readings.get("flow", 0.0)
        inlet_tds = self._current_readings.get("tds", 300.0)
        inlet_turb = self._current_readings.get("turbidity", 1.0)

        dt_hours = (tick_interval_s * self.speed_multiplier) / 3600.0
        dt_litres = flow_lpm * (tick_interval_s * self.speed_multiplier / 60.0)

        water_quality_factor = 1.0 + (inlet_tds / 1000.0) + (inlet_turb / 10.0)
        degrade_rate = self.scenario.filter_degradation_rate * water_quality_factor

        for stage, fstate in self._filter_states.items():
            fstate.operating_hours += dt_hours
            fstate.litres_processed += dt_litres

            hours_factor = fstate.operating_hours / fstate.estimated_life_hours
            litres_factor = fstate.litres_processed / fstate.estimated_life_litres
            combined = max(hours_factor, litres_factor)

            fstate.health_pct = max(0.0, 100.0 * (1.0 - combined * degrade_rate))

    def _avg_filter_health(self) -> float:
        if not self._filter_states:
            return 1.0
        return sum(fs.health_pct for fs in self._filter_states.values()) / (len(self._filter_states) * 100.0)

    # -- Output verification -------------------------------------------------

    def _verify_output(self, treatment_output: dict, inlet_readings: dict) -> VerificationResult:
        outlet_tds = treatment_output.get("outlet_tds", 0.0)
        outlet_turb = treatment_output.get("outlet_turbidity", 0.0)
        outlet_ph = treatment_output.get("outlet_ph", 7.0)
        outlet_temp = treatment_output.get("outlet_temperature", 25.0)

        inlet_tds = inlet_readings.get("tds", 300.0)
        inlet_turb = inlet_readings.get("turbidity", 1.0)
        inlet_ph = inlet_readings.get("ph", 7.0)

        if math.isnan(inlet_tds) or math.isnan(outlet_tds):
            return VerificationResult(
                status=VerificationStatus.UNAVAILABLE,
                outlet_tds=outlet_tds,
                outlet_ph=outlet_ph,
                outlet_turbidity=outlet_turb,
                outlet_temperature=outlet_temp,
                inlet_tds=inlet_tds,
                inlet_ph=inlet_ph,
                inlet_turbidity=inlet_turb,
                reduction_tds_pct=0.0,
                reduction_turbidity_pct=0.0,
                messages=["Sensor readings invalid — cannot verify."],
            )

        reduction_tds = 0.0 if inlet_tds == 0 else ((inlet_tds - outlet_tds) / inlet_tds * 100.0)
        reduction_turb = 0.0 if inlet_turb == 0 else ((inlet_turb - outlet_turb) / inlet_turb * 100.0)

        messages = []
        status = VerificationStatus.VERIFIED

        # Thresholds
        max_outlet_tds = self.config.get("max_outlet_tds", 100.0)
        max_outlet_turb = self.config.get("max_outlet_turbidity", 1.0)
        min_reduction_tds = self.config.get("min_tds_reduction_pct", 70.0)

        if outlet_tds > max_outlet_tds:
            status = VerificationStatus.WARNING
            messages.append(f"Outlet TDS {outlet_tds:.1f} ppm exceeds limit {max_outlet_tds} ppm.")

        if outlet_turb > max_outlet_turb:
            status = VerificationStatus.WARNING
            messages.append(f"Outlet turbidity {outlet_turb:.2f} NTU exceeds limit {max_outlet_turb} NTU.")

        if reduction_tds < min_reduction_tds:
            status = VerificationStatus.FAILED
            messages.append(f"TDS reduction {reduction_tds:.1f}% below required {min_reduction_tds}%.")

        if not messages:
            messages.append("Output verified within configured limits.")

        return VerificationResult(
            status=status,
            outlet_tds=outlet_tds,
            outlet_ph=outlet_ph,
            outlet_turbidity=outlet_turb,
            outlet_temperature=outlet_temp,
            inlet_tds=inlet_tds,
            inlet_ph=inlet_ph,
            inlet_turbidity=inlet_turb,
            reduction_tds_pct=reduction_tds,
            reduction_turbidity_pct=reduction_turb,
            messages=messages,
        )

    # -- Safety checks -------------------------------------------------------

    def _check_safety(self) -> SafetyCheckResult:
        reasons = []
        status = SafetyStatus.SAFE

        # Check sensor validity
        for st in [SensorType.TDS, SensorType.PH, SensorType.PRESSURE, SensorType.FLOW]:
            val = self._current_readings.get(st.value)
            if val is None or math.isnan(val):
                status = SafetyStatus.UNSAFE
                reasons.append(f"Critical sensor {st.value} invalid.")

        # Check verification
        if self._verification_result:
            if self._verification_result.status == VerificationStatus.FAILED:
                status = SafetyStatus.UNSAFE
                reasons.append("Output verification failed.")
            elif self._verification_result.status == VerificationStatus.WARNING:
                if status != SafetyStatus.UNSAFE:
                    status = SafetyStatus.WARNING
                reasons.append("Output verification warning.")

        # Check pressure/flow
        pressure = self._current_readings.get("pressure", 0.0)
        flow = self._current_readings.get("flow", 0.0)
        if pressure < 0.5:
            status = SafetyStatus.UNSAFE
            reasons.append(f"Pressure too low: {pressure:.2f} bar.")
        if flow < 0.1:
            status = SafetyStatus.UNSAFE
            reasons.append(f"Flow too low: {flow:.2f} L/min.")

        # Check treatment faults
        if self.fault_injector.get_treatment_faults():
            if status != SafetyStatus.UNSAFE:
                status = SafetyStatus.WARNING
            reasons.append("Treatment stage fault active.")

        dispensing_allowed = (status == SafetyStatus.SAFE)

        if not reasons:
            reasons.append("All safety checks passed.")

        return SafetyCheckResult(
            status=status,
            dispensing_allowed=dispensing_allowed,
            reasons=reasons,
        )

    # -- RO recovery ---------------------------------------------------------

    def _calculate_recovery(self, flow_rate: float) -> None:
        tick_interval_s = self.config.get("tick_interval_seconds", 1.0)
        dt_minutes = (tick_interval_s * self.speed_multiplier) / 60.0
        feed_vol = flow_rate * dt_minutes

        ro_recovery_ratio = self.config.get("ro_recovery_ratio", 0.5)
        permeate = feed_vol * ro_recovery_ratio
        reject = feed_vol * (1.0 - ro_recovery_ratio)

        self._recovery_data.feed_litres += feed_vol
        self._recovery_data.permeate_litres += permeate
        self._recovery_data.reject_litres += reject

        if self._recovery_data.feed_litres > 0:
            self._recovery_data.recovery_ratio_pct = (
                self._recovery_data.permeate_litres / self._recovery_data.feed_litres * 100.0
            )

    # -- Persistence & broadcast ---------------------------------------------

    async def _persist_to_db(self) -> None:
        if self.db_session_factory is None:
            return
        # Placeholder: actual DB write would go here
        pass

    async def _broadcast_state(self) -> None:
        state_dict = self.get_current_state()
        for listener in self._listeners:
            try:
                if asyncio.iscoroutinefunction(listener):
                    await listener(state_dict)
                else:
                    listener(state_dict)
            except Exception:
                pass

    # -- State getters -------------------------------------------------------

    def get_current_state(self) -> dict:
        return {
            "simulation_state": self.state.value,
            "tick_count": self._tick_count,
            "elapsed_seconds": self._elapsed_seconds,
            "speed_multiplier": self.speed_multiplier,
            "scenario": self.scenario.name if self.scenario else None,
            "readings": self._current_readings,
            "treatment": self._treatment_state,
            "filters": {
                stage.value: {
                    "health_pct": fs.health_pct,
                    "litres_processed": fs.litres_processed,
                    "operating_hours": fs.operating_hours,
                }
                for stage, fs in self._filter_states.items()
            },
            "recovery": {
                "feed_litres": self._recovery_data.feed_litres,
                "permeate_litres": self._recovery_data.permeate_litres,
                "reject_litres": self._recovery_data.reject_litres,
                "recovery_ratio_pct": self._recovery_data.recovery_ratio_pct,
                "reject_reuse_pct": self._recovery_data.reject_reuse_pct,
            },
            "verification": self._verification_to_dict(),
            "safety": self._safety_to_dict(),
            "faults": self.fault_injector.get_active_faults(),
        }

    def get_current_readings(self) -> dict:
        return dict(self._current_readings)

    def _verification_to_dict(self) -> Optional[dict]:
        if not self._verification_result:
            return None
        return {
            "status": self._verification_result.status.value,
            "outlet_tds": self._verification_result.outlet_tds,
            "outlet_ph": self._verification_result.outlet_ph,
            "outlet_turbidity": self._verification_result.outlet_turbidity,
            "outlet_temperature": self._verification_result.outlet_temperature,
            "reduction_tds_pct": self._verification_result.reduction_tds_pct,
            "reduction_turbidity_pct": self._verification_result.reduction_turbidity_pct,
            "messages": self._verification_result.messages,
        }

    def _safety_to_dict(self) -> Optional[dict]:
        if not self._safety_result:
            return None
        return {
            "status": self._safety_result.status.value,
            "dispensing_allowed": self._safety_result.dispensing_allowed,
            "reasons": self._safety_result.reasons,
        }

    # -- Listeners -----------------------------------------------------------

    def add_listener(self, callback: Callable[[dict], Any]) -> None:
        if callback not in self._listeners:
            self._listeners.append(callback)

    def remove_listener(self, callback: Callable[[dict], Any]) -> None:
        if callback in self._listeners:
            self._listeners.remove(callback)

    # -- Initialization helpers ----------------------------------------------

    def _reset_state(self) -> None:
        self._tick_count = 0
        self._elapsed_seconds = 0.0
        self._pause_elapsed = 0.0
        self._current_readings = {}
        self._treatment_state = {}
        self._executed_events.clear()
        self._recovery_data = RecoveryData()
        self._verification_result = None
        self._safety_result = None
        self._init_filter_states()

    def _init_sensors(self) -> None:
        if not self.scenario:
            return
        self.sensors = create_all_sensors()

    def _init_filter_states(self) -> None:
        self._filter_states = {
            TreatmentStage.SEDIMENT: FilterState(
                TreatmentStage.SEDIMENT, estimated_life_hours=2000, estimated_life_litres=8000
            ),
            TreatmentStage.CARBON: FilterState(
                TreatmentStage.CARBON, estimated_life_hours=3000, estimated_life_litres=12000
            ),
            TreatmentStage.UF: FilterState(
                TreatmentStage.UF, estimated_life_hours=5000, estimated_life_litres=20000
            ),
            TreatmentStage.RO: FilterState(
                TreatmentStage.RO, estimated_life_hours=8000, estimated_life_litres=30000
            ),
            TreatmentStage.UV: FilterState(
                TreatmentStage.UV, estimated_life_hours=10000, estimated_life_litres=100000
            ),
        }
