"""Realistic sensor simulation models for AQUASENSE-X.

Each sensor model produces physically plausible readings with configurable
noise, drift, faults, and cross-sensor correlations.
"""

from __future__ import annotations

import enum
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SensorType(str, enum.Enum):
    TDS = "tds"
    PH = "ph"
    TURBIDITY = "turbidity"
    TEMPERATURE = "temperature"
    FLOW = "flow"
    PRESSURE = "pressure"


class FaultType(str, enum.Enum):
    NONE = "none"
    STUCK = "stuck"
    SPIKE = "spike"
    DRIFT_FAST = "drift_fast"
    DEAD = "dead"
    NOISE_HIGH = "noise_high"
    OFFSET = "offset"


# ---------------------------------------------------------------------------
# Fault state
# ---------------------------------------------------------------------------

@dataclass
class FaultState:
    fault_type: FaultType = FaultType.NONE
    stuck_value: Optional[float] = None
    spike_magnitude: float = 0.0
    drift_rate_multiplier: float = 1.0
    noise_multiplier: float = 1.0
    offset_value: float = 0.0
    active_since: float = 0.0  # elapsed seconds when fault was injected


# ---------------------------------------------------------------------------
# Base sensor model
# ---------------------------------------------------------------------------

class SensorModel:
    """Base class for all simulated sensors."""

    def __init__(
        self,
        sensor_type: SensorType,
        base_value: float,
        noise_std: float,
        drift_rate: float,
        min_val: float,
        max_val: float,
        unit: str,
    ) -> None:
        self.sensor_type = sensor_type
        self.base_value = base_value
        self.noise_std = noise_std
        self.drift_rate = drift_rate  # units per hour of slow drift
        self.min_val = min_val
        self.max_val = max_val
        self.unit = unit

        self._manual_override: Optional[float] = None
        self.fault = FaultState()
        self._accumulated_drift: float = 0.0
        self._last_value: float = base_value

    # -- public API ---------------------------------------------------------

    def generate(
        self,
        elapsed_seconds: float,
        scenario_params: dict,
        rng: np.random.Generator,
        *,
        context: Optional[dict] = None,
    ) -> float:
        """Produce one reading for the current tick.

        *context* carries cross-sensor values for correlation
        (e.g. temperature for TDS, filter_health for pressure/flow).
        """
        if self._manual_override is not None:
            self._last_value = self._manual_override
            return self._last_value

        if self.fault.fault_type == FaultType.DEAD:
            return float("nan")

        if self.fault.fault_type == FaultType.STUCK:
            if self.fault.stuck_value is None:
                self.fault.stuck_value = self._last_value
            return self.fault.stuck_value

        # Base + scenario trend
        value = self._base_with_trend(elapsed_seconds, scenario_params, rng, context or {})

        # Slow drift (accumulates over time)
        dt_hours = elapsed_seconds / 3600.0
        drift_rate = self.drift_rate * self.fault.drift_rate_multiplier
        self._accumulated_drift = drift_rate * dt_hours
        value += self._accumulated_drift

        # Noise
        noise_scale = self.noise_std * self.fault.noise_multiplier
        if self.fault.fault_type == FaultType.NOISE_HIGH:
            noise_scale *= 5.0
        value += rng.normal(0.0, noise_scale)

        # Offset fault
        if self.fault.fault_type == FaultType.OFFSET:
            value += self.fault.offset_value

        # Spike fault (intermittent)
        if self.fault.fault_type == FaultType.SPIKE:
            if rng.random() < 0.15:
                direction = rng.choice([-1.0, 1.0])
                value += direction * self.fault.spike_magnitude

        # Fast drift fault
        if self.fault.fault_type == FaultType.DRIFT_FAST:
            time_in_fault = elapsed_seconds - self.fault.active_since
            value += self.drift_rate * 10.0 * (time_in_fault / 3600.0)

        value = float(np.clip(value, self.min_val, self.max_val))
        self._last_value = value
        return value

    def _base_with_trend(
        self,
        elapsed_seconds: float,
        scenario_params: dict,
        rng: np.random.Generator,
        context: dict,
    ) -> float:
        """Override in subclasses for sensor-specific behaviour."""
        return self.base_value

    def inject_fault(self, fault_type: FaultType, elapsed_seconds: float = 0.0, **kwargs) -> None:
        self.fault = FaultState(
            fault_type=fault_type,
            active_since=elapsed_seconds,
            spike_magnitude=kwargs.get("spike_magnitude", abs(self.base_value) * 0.5),
            drift_rate_multiplier=kwargs.get("drift_rate_multiplier", 10.0),
            noise_multiplier=kwargs.get("noise_multiplier", 5.0),
            offset_value=kwargs.get("offset_value", self.base_value * 0.2),
            stuck_value=kwargs.get("stuck_value", None),
        )

    def clear_fault(self) -> None:
        self.fault = FaultState()

    def set_manual_override(self, value: Optional[float]) -> None:
        self._manual_override = value

    def reset(self) -> None:
        self._manual_override = None
        self.fault = FaultState()
        self._accumulated_drift = 0.0
        self._last_value = self.base_value


# ---------------------------------------------------------------------------
# Concrete sensor models
# ---------------------------------------------------------------------------

class TDSSensor(SensorModel):
    """Total Dissolved Solids sensor (ppm).

    Slightly correlated with temperature: higher temperature increases
    apparent TDS by ~2% per °C above 25 °C (standard reference).
    """

    def __init__(self, base_value: float = 300.0, noise_std: float = 5.0,
                 drift_rate: float = 2.0) -> None:
        super().__init__(SensorType.TDS, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=2000.0, unit="ppm")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("tds_base", self.base_value)
        # Slow sinusoidal variation (period ~2h simulated)
        variation = scenario_params.get("tds_variation", 10.0)
        period = scenario_params.get("tds_period_s", 7200.0)
        value = base + variation * math.sin(2 * math.pi * elapsed_seconds / period)

        # Timed events: linear ramp toward target
        target = scenario_params.get("tds_target")
        if target is not None:
            ramp_start = scenario_params.get("tds_ramp_start_s", 0.0)
            ramp_dur = scenario_params.get("tds_ramp_duration_s", 60.0)
            if elapsed_seconds >= ramp_start:
                progress = min((elapsed_seconds - ramp_start) / ramp_dur, 1.0)
                value = value + (target - value) * progress

        # Temperature correlation
        temp = context.get("temperature", 25.0)
        if not math.isnan(temp):
            temp_factor = 1.0 + 0.02 * (temp - 25.0)
            value *= temp_factor

        return value


class PHSensor(SensorModel):
    """pH sensor (0–14 scale)."""

    def __init__(self, base_value: float = 7.0, noise_std: float = 0.05,
                 drift_rate: float = 0.01) -> None:
        super().__init__(SensorType.PH, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=14.0, unit="pH")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("ph_base", self.base_value)
        # Small oscillation
        osc = scenario_params.get("ph_oscillation", 0.1)
        period = scenario_params.get("ph_period_s", 5400.0)
        value = base + osc * math.sin(2 * math.pi * elapsed_seconds / period + 0.5)

        # Higher TDS water tends to be slightly more acidic
        tds = context.get("tds")
        if tds is not None and not math.isnan(tds):
            if tds > 500:
                value -= 0.0005 * (tds - 500)

        target = scenario_params.get("ph_target")
        if target is not None:
            ramp_start = scenario_params.get("ph_ramp_start_s", 0.0)
            ramp_dur = scenario_params.get("ph_ramp_duration_s", 60.0)
            if elapsed_seconds >= ramp_start:
                progress = min((elapsed_seconds - ramp_start) / ramp_dur, 1.0)
                value = value + (target - value) * progress

        return value


class TurbiditySensor(SensorModel):
    """Turbidity sensor (NTU)."""

    def __init__(self, base_value: float = 1.0, noise_std: float = 0.2,
                 drift_rate: float = 0.05) -> None:
        super().__init__(SensorType.TURBIDITY, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=200.0, unit="NTU")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("turbidity_base", self.base_value)
        # Occasional small bumps
        bump = 0.0
        if rng.random() < 0.02:
            bump = rng.exponential(0.5)
        value = base + bump

        target = scenario_params.get("turbidity_target")
        if target is not None:
            ramp_start = scenario_params.get("turbidity_ramp_start_s", 0.0)
            ramp_dur = scenario_params.get("turbidity_ramp_duration_s", 30.0)
            if elapsed_seconds >= ramp_start:
                progress = min((elapsed_seconds - ramp_start) / ramp_dur, 1.0)
                value = value + (target - value) * progress

        return value


class TemperatureSensor(SensorModel):
    """Temperature sensor (°C).

    Slow diurnal-like sinusoidal variation.
    """

    def __init__(self, base_value: float = 25.0, noise_std: float = 0.1,
                 drift_rate: float = 0.005) -> None:
        super().__init__(SensorType.TEMPERATURE, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=50.0, unit="°C")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("temperature_base", self.base_value)
        amplitude = scenario_params.get("temperature_amplitude", 2.0)
        period = scenario_params.get("temperature_period_s", 14400.0)  # 4h simulated
        value = base + amplitude * math.sin(2 * math.pi * elapsed_seconds / period)
        return value


class FlowSensor(SensorModel):
    """Flow rate sensor (L/min).

    Affected by system pressure and filter clogging.
    """

    def __init__(self, base_value: float = 1.5, noise_std: float = 0.05,
                 drift_rate: float = -0.01) -> None:
        super().__init__(SensorType.FLOW, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=5.0, unit="L/min")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("flow_base", self.base_value)
        value = base

        # Filter clogging reduces flow
        filter_health = context.get("avg_filter_health", 1.0)
        if filter_health < 1.0:
            value *= 0.5 + 0.5 * filter_health  # at 0% health → 50% flow

        # Pressure correlation: lower pressure → lower flow
        pressure = context.get("pressure")
        if pressure is not None and not math.isnan(pressure):
            nominal_pressure = scenario_params.get("pressure_base", 2.5)
            if nominal_pressure > 0:
                pressure_ratio = pressure / nominal_pressure
                value *= max(0.2, min(1.3, pressure_ratio))

        target = scenario_params.get("flow_target")
        if target is not None:
            ramp_start = scenario_params.get("flow_ramp_start_s", 0.0)
            ramp_dur = scenario_params.get("flow_ramp_duration_s", 30.0)
            if elapsed_seconds >= ramp_start:
                progress = min((elapsed_seconds - ramp_start) / ramp_dur, 1.0)
                value = value + (target - value) * progress

        return value


class PressureSensor(SensorModel):
    """Pressure sensor (bar).

    Increases as filters clog; drops if there is a leak or pump issue.
    """

    def __init__(self, base_value: float = 2.5, noise_std: float = 0.03,
                 drift_rate: float = 0.005) -> None:
        super().__init__(SensorType.PRESSURE, base_value, noise_std, drift_rate,
                         min_val=0.0, max_val=8.0, unit="bar")

    def _base_with_trend(self, elapsed_seconds, scenario_params, rng, context):
        base = scenario_params.get("pressure_base", self.base_value)
        value = base

        # Filter clogging increases differential pressure
        filter_health = context.get("avg_filter_health", 1.0)
        if filter_health < 1.0:
            value += (1.0 - filter_health) * 1.5  # up to +1.5 bar at full clog

        target = scenario_params.get("pressure_target")
        if target is not None:
            ramp_start = scenario_params.get("pressure_ramp_start_s", 0.0)
            ramp_dur = scenario_params.get("pressure_ramp_duration_s", 30.0)
            if elapsed_seconds >= ramp_start:
                progress = min((elapsed_seconds - ramp_start) / ramp_dur, 1.0)
                value = value + (target - value) * progress

        return value


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

SENSOR_CLASSES: dict[SensorType, type[SensorModel]] = {
    SensorType.TDS: TDSSensor,
    SensorType.PH: PHSensor,
    SensorType.TURBIDITY: TurbiditySensor,
    SensorType.TEMPERATURE: TemperatureSensor,
    SensorType.FLOW: FlowSensor,
    SensorType.PRESSURE: PressureSensor,
}


def create_sensor(sensor_type: SensorType, **kwargs) -> SensorModel:
    cls = SENSOR_CLASSES[sensor_type]
    return cls(**kwargs)


def create_all_sensors(overrides: Optional[dict] = None) -> dict[SensorType, SensorModel]:
    overrides = overrides or {}
    sensors: dict[SensorType, SensorModel] = {}
    for st, cls in SENSOR_CLASSES.items():
        kw = overrides.get(st, {})
        sensors[st] = cls(**kw)
    return sensors
