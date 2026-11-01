from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database.models import AlertModel, SystemEventModel
from app.domain.enums import AlertCategory, AlertSeverity


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_alert(
        self,
        severity: AlertSeverity,
        category: AlertCategory,
        source: str,
        description: str,
        recommended_action: str = "",
    ) -> AlertModel:
        alert = AlertModel(
            timestamp=datetime.now(timezone.utc),
            severity=severity.value,
            category=category.value,
            source=source,
            description=description,
            recommended_action=recommended_action,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_alerts(
        self,
        severity: AlertSeverity | None = None,
        category: AlertCategory | None = None,
        acknowledged: bool | None = None,
        resolved: bool | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
    ) -> tuple[list[AlertModel], int]:
        query = self.db.query(AlertModel)
        count_query = self.db.query(func.count(AlertModel.id))

        if severity:
            query = query.filter(AlertModel.severity == severity.value)
            count_query = count_query.filter(AlertModel.severity == severity.value)
        if category:
            query = query.filter(AlertModel.category == category.value)
            count_query = count_query.filter(AlertModel.category == category.value)
        if acknowledged is not None:
            query = query.filter(AlertModel.acknowledged == acknowledged)
            count_query = count_query.filter(AlertModel.acknowledged == acknowledged)
        if resolved is not None:
            query = query.filter(AlertModel.resolved == resolved)
            count_query = count_query.filter(AlertModel.resolved == resolved)
        if start:
            query = query.filter(AlertModel.timestamp >= start)
            count_query = count_query.filter(AlertModel.timestamp >= start)
        if end:
            query = query.filter(AlertModel.timestamp <= end)
            count_query = count_query.filter(AlertModel.timestamp <= end)
        if search:
            pattern = f"%{search}%"
            query = query.filter(AlertModel.description.like(pattern))
            count_query = count_query.filter(AlertModel.description.like(pattern))

        total = count_query.scalar() or 0
        alerts = query.order_by(desc(AlertModel.timestamp)).offset(offset).limit(limit).all()
        return alerts, total

    def acknowledge_alert(self, alert_id: int) -> AlertModel | None:
        alert = self.db.query(AlertModel).filter(AlertModel.id == alert_id).first()
        if alert and not alert.acknowledged:
            alert.acknowledged = True
            alert.acknowledged_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(alert)
        return alert

    def resolve_alert(self, alert_id: int) -> AlertModel | None:
        alert = self.db.query(AlertModel).filter(AlertModel.id == alert_id).first()
        if alert and not alert.resolved:
            alert.resolved = True
            alert.resolved_at = datetime.now(timezone.utc)
            if not alert.acknowledged:
                alert.acknowledged = True
                alert.acknowledged_at = alert.resolved_at
            self.db.commit()
            self.db.refresh(alert)
        return alert

    def get_unacknowledged_count(self) -> int:
        return (
            self.db.query(func.count(AlertModel.id))
            .filter(AlertModel.acknowledged == False)  # noqa: E712
            .scalar() or 0
        )

    def get_critical_count(self) -> int:
        return (
            self.db.query(func.count(AlertModel.id))
            .filter(AlertModel.severity == AlertSeverity.CRITICAL.value)
            .filter(AlertModel.resolved == False)  # noqa: E712
            .scalar() or 0
        )

    def save_event(
        self,
        event_type: str,
        source: str,
        description: str,
        metadata_json: str | None = None,
    ) -> SystemEventModel:
        event = SystemEventModel(
            timestamp=datetime.now(timezone.utc),
            event_type=event_type,
            source=source,
            description=description,
            metadata_json=metadata_json,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_events(
        self,
        event_type: str | None = None,
        limit: int = 50,
    ) -> list[SystemEventModel]:
        query = self.db.query(SystemEventModel)
        if event_type:
            query = query.filter(SystemEventModel.event_type == event_type)
        return query.order_by(desc(SystemEventModel.timestamp)).limit(limit).all()
