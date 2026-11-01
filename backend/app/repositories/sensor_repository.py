from __future__ import annotations

from datetime import datetime

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database.models import SensorReadingModel
from app.domain.enums import SensorType


class SensorRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_reading(
        self,
        session_id: str | None,
        sensor_type: SensorType,
        value: float,
        unit: str,
        timestamp: datetime,
        is_valid: bool = True,
        is_simulated: bool = True,
    ) -> SensorReadingModel:
        reading = SensorReadingModel(
            session_id=session_id,
            sensor_type=sensor_type.value,
            value=value,
            unit=unit,
            timestamp=timestamp,
            is_valid=is_valid,
            is_simulated=is_simulated,
        )
        self.db.add(reading)
        self.db.commit()
        self.db.refresh(reading)
        return reading

    def save_readings_batch(
        self,
        readings: list[dict],
    ) -> None:
        objects = [
            SensorReadingModel(
                session_id=r.get("session_id"),
                sensor_type=r["sensor_type"],
                value=r["value"],
                unit=r["unit"],
                timestamp=r["timestamp"],
                is_valid=r.get("is_valid", True),
                is_simulated=r.get("is_simulated", True),
            )
            for r in readings
        ]
        self.db.bulk_save_objects(objects)
        self.db.commit()

    def get_latest_readings(self) -> list[SensorReadingModel]:
        latest: list[SensorReadingModel] = []
        for st in SensorType:
            reading = (
                self.db.query(SensorReadingModel)
                .filter(SensorReadingModel.sensor_type == st.value)
                .order_by(desc(SensorReadingModel.timestamp))
                .first()
            )
            if reading:
                latest.append(reading)
        return latest

    def get_history(
        self,
        sensor_type: SensorType | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 500,
    ) -> list[SensorReadingModel]:
        query = self.db.query(SensorReadingModel)
        if sensor_type:
            query = query.filter(SensorReadingModel.sensor_type == sensor_type.value)
        if start:
            query = query.filter(SensorReadingModel.timestamp >= start)
        if end:
            query = query.filter(SensorReadingModel.timestamp <= end)
        return query.order_by(desc(SensorReadingModel.timestamp)).limit(limit).all()

    def get_session_readings(
        self,
        session_id: str,
        sensor_type: SensorType | None = None,
        limit: int = 1000,
    ) -> list[SensorReadingModel]:
        query = (
            self.db.query(SensorReadingModel)
            .filter(SensorReadingModel.session_id == session_id)
        )
        if sensor_type:
            query = query.filter(SensorReadingModel.sensor_type == sensor_type.value)
        return query.order_by(SensorReadingModel.timestamp).limit(limit).all()
