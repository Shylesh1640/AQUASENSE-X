from __future__ import annotations

from enum import Enum


class SimulationState(str, Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"


class SensorType(str, Enum):
    TDS = "TDS"
    PH = "PH"
    TURBIDITY = "TURBIDITY"
    TEMPERATURE = "TEMPERATURE"
    FLOW = "FLOW"
    PRESSURE = "PRESSURE"


class QualityLevel(str, Enum):
    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"


class TreatmentStage(str, Enum):
    SEDIMENT = "sediment"
    CARBON = "carbon"
    UF = "uf"
    RO = "ro"
    UV = "uv"
    SELECTIVE_MEDIA = "selective_media"
    REMINERALIZATION = "remineralization"


class StageStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    WARNING = "warning"
    FAILED = "failed"
    BYPASSED = "bypassed"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class AlertCategory(str, Enum):
    SENSOR_WARNING = "sensor_warning"
    SENSOR_FAILURE = "sensor_failure"
    WATER_QUALITY = "water_quality"
    TREATMENT_FAILURE = "treatment_failure"
    VERIFICATION_FAILURE = "verification_failure"
    ABNORMAL_PRESSURE = "abnormal_pressure"
    LOW_FLOW = "low_flow"
    FILTER_REPLACEMENT = "filter_replacement"
    UV_FAULT = "uv_fault"
    DISPENSING_LOCK = "dispensing_lock"
    SYSTEM = "system"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    WARNING = "warning"
    FAILED = "failed"
    UNABLE_TO_VERIFY = "unable_to_verify"


class DispensingStatus(str, Enum):
    ALLOWED = "allowed"
    LOCKED = "locked"


class FilterComponent(str, Enum):
    SEDIMENT = "sediment"
    CARBON = "carbon"
    UF_MEMBRANE = "uf_membrane"
    RO_MEMBRANE = "ro_membrane"
    UV_LAMP = "uv_lamp"


class ScenarioType(str, Enum):
    NORMAL = "normal"
    POOR_QUALITY = "poor_quality"
    ABNORMAL = "abnormal"
    CUSTOM = "custom"
