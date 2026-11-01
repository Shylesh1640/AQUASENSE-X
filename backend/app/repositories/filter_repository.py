from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database.models import (
    FilterHealthHistoryModel,
    FilterInventoryModel,
    MaintenanceRecordModel,
)
from app.domain.enums import FilterComponent


class FilterRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_filters(self) -> list[FilterInventoryModel]:
        return self.db.query(FilterInventoryModel).all()

    def get_filter(self, filter_id: int) -> FilterInventoryModel | None:
        return self.db.query(FilterInventoryModel).filter(FilterInventoryModel.id == filter_id).first()

    def get_filter_by_component(self, component: FilterComponent) -> FilterInventoryModel | None:
        return (
            self.db.query(FilterInventoryModel)
            .filter(FilterInventoryModel.component == component.value)
            .first()
        )

    def create_filter(
        self,
        component: FilterComponent,
        expected_life_hours: float,
    ) -> FilterInventoryModel:
        filt = FilterInventoryModel(
            component=component.value,
            installed_date=datetime.now(timezone.utc),
            expected_life_hours=expected_life_hours,
            litres_processed=0,
            operating_hours=0,
            pressure_differential=0,
            flow_degradation=0,
            cycles=0,
            health_pct=100.0,
            status="normal",
        )
        self.db.add(filt)
        self.db.commit()
        self.db.refresh(filt)
        return filt

    def update_filter_health(
        self,
        filter_id: int,
        health_pct: float,
        litres_processed: float | None = None,
        operating_hours: float | None = None,
        pressure_differential: float | None = None,
        flow_degradation: float | None = None,
        cycles: int | None = None,
        status: str | None = None,
    ) -> FilterInventoryModel | None:
        filt = self.db.query(FilterInventoryModel).filter(FilterInventoryModel.id == filter_id).first()
        if not filt:
            return None
        filt.health_pct = health_pct
        if litres_processed is not None:
            filt.litres_processed = litres_processed
        if operating_hours is not None:
            filt.operating_hours = operating_hours
        if pressure_differential is not None:
            filt.pressure_differential = pressure_differential
        if flow_degradation is not None:
            filt.flow_degradation = flow_degradation
        if cycles is not None:
            filt.cycles = cycles
        if status is not None:
            filt.status = status
        self.db.commit()
        self.db.refresh(filt)
        return filt

    def save_health_history(
        self,
        filter_id: int,
        health_pct: float,
        litres_processed: float,
        operating_hours: float,
        pressure_differential: float | None = None,
    ) -> FilterHealthHistoryModel:
        record = FilterHealthHistoryModel(
            filter_id=filter_id,
            timestamp=datetime.now(timezone.utc),
            health_pct=health_pct,
            litres_processed=litres_processed,
            operating_hours=operating_hours,
            pressure_differential=pressure_differential,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_health_history(
        self,
        filter_id: int,
        limit: int = 200,
    ) -> list[FilterHealthHistoryModel]:
        return (
            self.db.query(FilterHealthHistoryModel)
            .filter(FilterHealthHistoryModel.filter_id == filter_id)
            .order_by(desc(FilterHealthHistoryModel.timestamp))
            .limit(limit)
            .all()
        )

    def save_maintenance(
        self,
        filter_id: int,
        action: str,
        notes: str | None = None,
    ) -> MaintenanceRecordModel:
        record = MaintenanceRecordModel(
            filter_id=filter_id,
            action=action,
            timestamp=datetime.now(timezone.utc),
            notes=notes,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_maintenance_history(
        self,
        filter_id: int | None = None,
        limit: int = 50,
    ) -> list[MaintenanceRecordModel]:
        query = self.db.query(MaintenanceRecordModel)
        if filter_id is not None:
            query = query.filter(MaintenanceRecordModel.filter_id == filter_id)
        return query.order_by(desc(MaintenanceRecordModel.timestamp)).limit(limit).all()

    def ensure_default_filters(self) -> None:
        from app.core.config import settings
        defaults = {
            FilterComponent.SEDIMENT: settings.FILTER_SEDIMENT_LIFE_HOURS,
            FilterComponent.CARBON: settings.FILTER_CARBON_LIFE_HOURS,
            FilterComponent.UF_MEMBRANE: settings.FILTER_UF_LIFE_HOURS,
            FilterComponent.RO_MEMBRANE: settings.FILTER_RO_LIFE_HOURS,
            FilterComponent.UV_LAMP: settings.FILTER_UV_LIFE_HOURS,
        }
        for component, life_hours in defaults.items():
            existing = self.get_filter_by_component(component)
            if not existing:
                self.create_filter(component, life_hours)
