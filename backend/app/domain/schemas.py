from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.domain.enums import (
    AlertCategory,
    AlertSeverity,
    DispensingStatus,
    FilterComponent,
    QualityLevel,
    ScenarioType,
    SensorType,
    SimulationState,
    StageStatus,
    TreatmentStage,
    VerificationStatus,
)


# ── Sensor ──────────────────────────────────────────────────────────────────

class SensorReading(BaseModel):
    sensor_type: SensorType = Field(description="Type of sensor")
    value: float = Field(description="Measured or simulated value")
    unit: str = Field(description="Measurement unit")
    timestamp: datetime = Field(description="Reading timestamp (UTC)")
    is_valid: bool = Field(default=True, description="Whether the reading passed plausibility checks")
    is_simulated: bool = Field(default=True, description="Whether this is a simulated reading")
    quality: QualityLevel = Field(default=QualityLevel.NORMAL, description="Quality classification")


class SensorReadingResponse(BaseModel):
    readings: list[SensorReading] = Field(description="Current sensor readings for all sensors")
    timestamp: datetime = Field(description="Response timestamp")
    simulation_active: bool = Field(description="Whether simulation is running")


class SensorHistoryResponse(BaseModel):
    sensor_type: SensorType
    readings: list[SensorReading]
    count: int
    start_time: datetime | None = None
    end_time: datetime | None = None


# ── Simulation ──────────────────────────────────────────────────────────────

class SimulationConfig(BaseModel):
    scenario: ScenarioType = Field(default=ScenarioType.NORMAL, description="Simulation scenario")
    speed: int = Field(default=1, ge=1, le=10, description="Simulation speed multiplier")
    seed: int | None = Field(default=None, description="Random seed for reproducibility")
    noise_level: float = Field(default=0.05, ge=0.0, le=1.0, description="Sensor noise amplitude (0-1)")
    drift_rate: float = Field(default=0.001, ge=0.0, le=0.1, description="Sensor drift rate per tick")
    custom_params: dict[str, Any] | None = Field(default=None, description="Custom scenario parameters")


class SimulationStatus(BaseModel):
    state: SimulationState = Field(description="Current simulation state")
    scenario: ScenarioType = Field(description="Active scenario")
    speed: int = Field(description="Speed multiplier")
    tick_count: int = Field(default=0, description="Number of simulation ticks elapsed")
    elapsed_seconds: float = Field(default=0.0, description="Simulated elapsed time in seconds")
    session_id: str | None = Field(default=None, description="Current session identifier")
    started_at: datetime | None = None
    seed: int | None = None


class FaultInjectionRequest(BaseModel):
    sensor_type: SensorType | None = Field(default=None, description="Sensor to inject fault into")
    fault_type: str = Field(description="Type of fault: stuck, drift, spike, dropout, noise")
    duration_ticks: int = Field(default=30, ge=1, le=1000, description="Duration in simulation ticks")
    magnitude: float = Field(default=1.0, ge=0.0, le=10.0, description="Fault magnitude multiplier")


class SensorAdjustment(BaseModel):
    sensor_type: SensorType = Field(description="Sensor to adjust")
    value: float = Field(description="New base value")


# ── Water Quality ───────────────────────────────────────────────────────────

class ParameterAssessment(BaseModel):
    sensor_type: SensorType
    value: float
    unit: str
    level: QualityLevel
    description: str = Field(description="Human-readable explanation")
    threshold_low: float | None = None
    threshold_high: float | None = None
    is_valid: bool = True


class WaterQualityAssessment(BaseModel):
    timestamp: datetime
    overall_level: QualityLevel = Field(description="Worst-case level across all parameters")
    parameters: list[ParameterAssessment]
    summary: str = Field(description="Plain-language summary of water quality")
    requires_attention: bool = False
    attention_reasons: list[str] = Field(default_factory=list)
    is_simulated: bool = True


# ── Treatment ───────────────────────────────────────────────────────────────

class StageStatusDetail(BaseModel):
    stage: TreatmentStage
    status: StageStatus
    input_tds: float | None = None
    output_tds: float | None = None
    input_turbidity: float | None = None
    output_turbidity: float | None = None
    flow_rate: float | None = None
    pressure: float | None = None
    efficiency: float | None = Field(default=None, description="Current operating efficiency (0-1)")
    fault_reason: str | None = None


class TreatmentStatus(BaseModel):
    timestamp: datetime
    active_path: list[TreatmentStage] = Field(description="Currently active treatment stages in order")
    stages: list[StageStatusDetail]
    decision_reason: str = Field(description="Why this treatment path was selected")
    inlet_quality: QualityLevel
    is_simulated: bool = True


class TreatmentConfigUpdate(BaseModel):
    stage: TreatmentStage
    enabled: bool = True
    bypass: bool = False
    efficiency_override: float | None = Field(default=None, ge=0.0, le=1.0)


# ── Verification ────────────────────────────────────────────────────────────

class VerificationResult(BaseModel):
    timestamp: datetime
    status: VerificationStatus
    inlet_tds: float | None = None
    outlet_tds: float | None = None
    inlet_ph: float | None = None
    outlet_ph: float | None = None
    inlet_turbidity: float | None = None
    outlet_turbidity: float | None = None
    outlet_temperature: float | None = None
    tds_reduction_pct: float | None = Field(default=None, description="Percentage TDS reduction")
    details: str = Field(default="", description="Verification details")
    failed_checks: list[str] = Field(default_factory=list)
    is_simulated: bool = True


# ── Safety ──────────────────────────────────────────────────────────────────

class SafetyStatus(BaseModel):
    dispensing: DispensingStatus
    lock_reasons: list[str] = Field(default_factory=list, description="Reasons dispensing is locked")
    last_verified: datetime | None = None
    critical_faults: list[str] = Field(default_factory=list)
    sensor_validity: dict[str, bool] = Field(default_factory=dict)
    requires_acknowledgement: bool = False
    is_simulated: bool = True


# ── Filter ──────────────────────────────────────────────────────────────────

class FilterHealth(BaseModel):
    component: FilterComponent
    health_pct: float = Field(ge=0, le=100, description="Estimated health percentage")
    installed_date: datetime | None = None
    expected_life_hours: float = 0
    litres_processed: float = 0
    operating_hours: float = 0
    pressure_differential: float | None = None
    flow_degradation: float | None = Field(default=None, description="Flow rate reduction from baseline (%)")
    cycles: int = 0
    status: QualityLevel = QualityLevel.NORMAL
    estimated_remaining_hours: float | None = None
    estimated_remaining_litres: float | None = None
    recommendation: str = ""


class FilterPrediction(BaseModel):
    component: FilterComponent
    predicted_remaining_hours: float
    predicted_remaining_litres: float
    confidence: float = Field(ge=0, le=1, description="Model confidence (0-1)")
    predicted_replacement_date: datetime | None = None
    model_version: str | None = None
    features_used: list[str] = Field(default_factory=list)
    is_experimental: bool = Field(default=True, description="True until validated with real calibration data")
    warning: str = Field(
        default="Trained on synthetic data. Not a validated prediction.",
        description="Disclaimer about prediction reliability",
    )


class FilterPredictionResponse(BaseModel):
    predictions: list[FilterPrediction]
    model_info: str
    generated_at: datetime


# ── Alerts ──────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    severity: AlertSeverity
    category: AlertCategory
    source: str
    description: str
    recommended_action: str = ""


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    severity: AlertSeverity
    category: AlertCategory
    source: str
    description: str
    recommended_action: str
    acknowledged: bool = False
    acknowledged_at: datetime | None = None
    resolved: bool = False
    resolved_at: datetime | None = None


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int
    unacknowledged: int
    critical_count: int


# ── Recovery ────────────────────────────────────────────────────────────────

class RecoverySummary(BaseModel):
    timestamp: datetime
    total_feed_litres: float = Field(description="Total water fed to RO")
    total_permeate_litres: float = Field(description="Total purified water produced")
    total_reject_litres: float = Field(description="Total reject water produced")
    recovery_ratio: float = Field(description="Actual recovery ratio")
    reject_reuse_litres: float = Field(description="Reject water directed to non-potable reuse")
    reject_reuse_pct: float = Field(description="Percentage of reject reused")
    reject_discharge_litres: float = Field(description="Reject water discharged")
    is_simulated: bool = True


# ── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    period_start: datetime
    period_end: datetime
    total_litres_processed: float
    average_inlet_tds: float | None = None
    average_outlet_tds: float | None = None
    average_recovery_ratio: float | None = None
    total_alerts: int = 0
    critical_alerts: int = 0
    filter_replacements: int = 0
    dispensing_lock_events: int = 0
    uptime_pct: float | None = None


class ExportRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    sensor_types: list[SensorType] | None = None
    include_treatment: bool = True
    include_alerts: bool = True
    format: str = Field(default="csv", description="Export format: csv")


# ── System ──────────────────────────────────────────────────────────────────

class SystemHealth(BaseModel):
    status: str = Field(description="healthy | degraded | unhealthy")
    database: bool
    simulation_engine: bool
    websocket: bool
    ml_model_available: bool
    uptime_seconds: float
    version: str


class SystemStatus(BaseModel):
    health: SystemHealth
    simulation: SimulationStatus
    safety: SafetyStatus
    active_alerts: int
    critical_alerts: int
    filters_needing_attention: int


class SystemSettingUpdate(BaseModel):
    key: str
    value: str
    category: str = "general"
