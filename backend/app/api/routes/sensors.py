"""Sensor data routes."""
from fastapi import APIRouter, Request, Query
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("/current")
async def get_current_readings(request: Request):
    """Get current sensor readings."""
    sensor_service = request.app.state.services['sensor']
    readings = sensor_service.get_current_readings()
    return [r.dict() for r in readings]

@router.get("/history")
async def get_sensor_history(
    request: Request,
    sensor_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=10000)
):
    """Get historical sensor readings."""
    sensor_service = request.app.state.services['sensor']

    start_dt = datetime.fromisoformat(start) if start else datetime.utcnow() - timedelta(hours=24)
    end_dt = datetime.fromisoformat(end) if end else datetime.utcnow()

    from ...domain.enums import SensorType
    sensor_type_enum = SensorType(sensor_type) if sensor_type else None

    readings = sensor_service.get_sensor_history(
        sensor_type=sensor_type_enum,
        start=start_dt,
        end=end_dt,
        limit=limit
    )
    return [r.dict() for r in readings]

@router.get("/config")
async def get_sensor_config(request: Request):
    """Get sensor configuration and thresholds."""
    sensor_service = request.app.state.services['sensor']
    return sensor_service.get_sensor_config()
