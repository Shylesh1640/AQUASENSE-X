from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)

from app.database.connection import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SensorReadingModel(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=True, index=True)
    sensor_type = Column(String(20), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(10), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    is_valid = Column(Boolean, default=True)
    is_simulated = Column(Boolean, default=True)

    __table_args__ = (
        Index("ix_sensor_readings_type_ts", "sensor_type", "timestamp"),
    )


class SimulationSessionModel(Base):
    __tablename__ = "simulation_sessions"

    id = Column(String(64), primary_key=True)
    scenario = Column(String(20), nullable=False, default="normal")
    state = Column(String(20), nullable=False, default="stopped")
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)
    config_json = Column(Text, nullable=True)
    seed = Column(Integer, nullable=True)


class TreatmentRunModel(Base):
    __tablename__ = "treatment_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    inlet_quality_json = Column(Text, nullable=True)
    treatment_path_json = Column(Text, nullable=True)
    outlet_quality_json = Column(Text, nullable=True)
    decision_reason = Column(Text, nullable=True)


class VerificationRecordModel(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    inlet_readings_json = Column(Text, nullable=True)
    outlet_readings_json = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)
    details = Column(Text, nullable=True)


class FilterInventoryModel(Base):
    __tablename__ = "filter_inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    component = Column(String(20), nullable=False, unique=True, index=True)
    installed_date = Column(DateTime, nullable=False, default=_utcnow)
    expected_life_hours = Column(Float, nullable=False, default=2000)
    litres_processed = Column(Float, nullable=False, default=0)
    operating_hours = Column(Float, nullable=False, default=0)
    pressure_differential = Column(Float, nullable=True, default=0)
    flow_degradation = Column(Float, nullable=True, default=0)
    cycles = Column(Integer, nullable=False, default=0)
    health_pct = Column(Float, nullable=False, default=100.0)
    status = Column(String(20), nullable=False, default="normal")


class FilterHealthHistoryModel(Base):
    __tablename__ = "filter_health_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filter_id = Column(Integer, ForeignKey("filter_inventory.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    health_pct = Column(Float, nullable=False)
    litres_processed = Column(Float, nullable=False)
    operating_hours = Column(Float, nullable=False)
    pressure_differential = Column(Float, nullable=True)


class MaintenanceRecordModel(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filter_id = Column(Integer, ForeignKey("filter_inventory.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=_utcnow)
    notes = Column(Text, nullable=True)


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    severity = Column(String(20), nullable=False, index=True)
    category = Column(String(30), nullable=False, index=True)
    source = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True, default="")
    acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_alerts_sev_ack", "severity", "acknowledged"),
    )


class SystemEventModel(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    event_type = Column(String(30), nullable=False)
    source = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)


class WaterFlowRecordModel(Base):
    __tablename__ = "water_flow_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)
    feed_volume = Column(Float, nullable=False, default=0)
    permeate_volume = Column(Float, nullable=False, default=0)
    reject_volume = Column(Float, nullable=False, default=0)
    recovery_ratio = Column(Float, nullable=False, default=0)
    reuse_volume = Column(Float, nullable=False, default=0)


class ModelVersionModel(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_type = Column(String(50), nullable=False)
    version = Column(String(20), nullable=False)
    trained_at = Column(DateTime, nullable=False, default=_utcnow)
    metrics_json = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)


class ApplicationSettingModel(Base):
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="general")
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)
