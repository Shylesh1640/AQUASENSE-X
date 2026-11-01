"""Fault injection subsystem for AQUASENSE-X simulation.

Manages active faults across sensors, treatment stages, and hydraulics.
"""

from __future__ import annotations

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from ..simulation.sensor_models import FaultType, SensorType


class TreatmentStage(str, enum.Enum):
    SEDIMENT = "sediment"
    CARBON = "carbon"
    UF = "uf"
    RO = "ro"
    UV = "uv"
    SELECTIVE = "selective"
    REMINERALIZATION = "remineralization"


@dataclass
class ActiveFault:
    fault_id: str
    category: str  # "sensor", "pressure", "flow", "treatment", "uv"
    description: str
    params: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    sensor_type: Optional[SensorType] = None
    treatment_stage: Optional[TreatmentStage] = None


class FaultInjector:
    """Central controller for all simulated faults."""

    def __init__(self) -> None:
        self._active_faults: dict[str, ActiveFault] = {}
        self._treatment_faults: dict[TreatmentStage, str] = {}

    # -- Sensor faults -------------------------------------------------------

    def inject_sensor_fault(
        self,
        sensor_type: SensorType,
        fault_type: FaultType,
        params: Optional[dict] = None,
    ) -> str:
        fault_id = str(uuid.uuid4())[:8]
        self._active_faults[fault_id] = ActiveFault(
            fault_id=fault_id,
            category="sensor",
            description=f"{sensor_type.value} sensor: {fault_type.value}",
            params={"fault_type": fault_type, **(params or {})},
            sensor_type=sensor_type,
        )
        return fault_id

    # -- Hydraulic faults ----------------------------------------------------

    def inject_pressure_anomaly(self, severity: float = 0.5) -> str:
        """Simulate pressure anomaly (0.0=mild, 1.0=severe)."""
        fault_id = str(uuid.uuid4())[:8]
        target_pressure = max(0.3, 2.5 * (1.0 - severity))
        self._active_faults[fault_id] = ActiveFault(
            fault_id=fault_id,
            category="pressure",
            description=f"Pressure anomaly (severity {severity:.1f})",
            params={
                "severity": severity,
                "target_pressure": target_pressure,
            },
        )
        return fault_id

    def inject_flow_interruption(self) -> str:
        """Simulate complete or partial flow interruption."""
        fault_id = str(uuid.uuid4())[:8]
        self._active_faults[fault_id] = ActiveFault(
            fault_id=fault_id,
            category="flow",
            description="Flow interruption",
            params={"target_flow": 0.0},
        )
        return fault_id

    # -- Treatment faults ----------------------------------------------------

    def inject_treatment_failure(self, stage: TreatmentStage) -> str:
        fault_id = str(uuid.uuid4())[:8]
        self._active_faults[fault_id] = ActiveFault(
            fault_id=fault_id,
            category="treatment",
            description=f"Treatment stage failure: {stage.value}",
            treatment_stage=stage,
        )
        self._treatment_faults[stage] = fault_id
        return fault_id

    def inject_uv_fault(self) -> str:
        return self.inject_treatment_failure(TreatmentStage.UV)

    # -- Fault management ----------------------------------------------------

    def clear_fault(self, fault_id: str) -> bool:
        fault = self._active_faults.pop(fault_id, None)
        if fault is None:
            return False
        if fault.treatment_stage and fault.treatment_stage in self._treatment_faults:
            if self._treatment_faults[fault.treatment_stage] == fault_id:
                del self._treatment_faults[fault.treatment_stage]
        return True

    def clear_all_faults(self) -> int:
        count = len(self._active_faults)
        self._active_faults.clear()
        self._treatment_faults.clear()
        return count

    def get_active_faults(self) -> list[dict]:
        return [
            {
                "fault_id": f.fault_id,
                "category": f.category,
                "description": f.description,
                "params": f.params,
                "created_at": f.created_at.isoformat(),
                "sensor_type": f.sensor_type.value if f.sensor_type else None,
                "treatment_stage": f.treatment_stage.value if f.treatment_stage else None,
            }
            for f in self._active_faults.values()
        ]

    # -- Query helpers -------------------------------------------------------

    def get_sensor_faults(self) -> dict[SensorType, ActiveFault]:
        return {
            f.sensor_type: f
            for f in self._active_faults.values()
            if f.category == "sensor" and f.sensor_type is not None
        }

    def get_treatment_faults(self) -> set[TreatmentStage]:
        return set(self._treatment_faults.keys())

    def has_pressure_fault(self) -> bool:
        return any(f.category == "pressure" for f in self._active_faults.values())

    def has_flow_fault(self) -> bool:
        return any(f.category == "flow" for f in self._active_faults.values())

    def get_pressure_fault_params(self) -> Optional[dict]:
        for f in self._active_faults.values():
            if f.category == "pressure":
                return f.params
        return None

    def get_flow_fault_params(self) -> Optional[dict]:
        for f in self._active_faults.values():
            if f.category == "flow":
                return f.params
        return None

    @property
    def has_any_faults(self) -> bool:
        return len(self._active_faults) > 0
