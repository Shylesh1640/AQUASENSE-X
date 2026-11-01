"""Water quality assessment routes."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/water-quality", tags=["Water Quality"])

@router.get("/current")
async def get_water_quality(request: Request):
    """Get current water quality assessment."""
    sensor_service = request.app.state.services['sensor']
    water_quality_service = request.app.state.services['water_quality']

    readings = sensor_service.get_current_readings()
    assessment = water_quality_service.assess_quality(readings)

    return assessment.dict()

@router.get("/history")
async def get_water_quality_history(request: Request):
    """Get historical water quality data."""
    # For now, return recent assessment
    # In a full implementation, this would query historical assessments from DB
    sensor_service = request.app.state.services['sensor']
    water_quality_service = request.app.state.services['water_quality']

    readings = sensor_service.get_current_readings()
    assessment = water_quality_service.assess_quality(readings)

    return [assessment.dict()]

@router.get("/thresholds")
async def get_thresholds(request: Request):
    """Get current water quality thresholds."""
    water_quality_service = request.app.state.services['water_quality']
    return {"thresholds": water_quality_service.thresholds}

@router.put("/thresholds")
async def update_thresholds(thresholds: dict, request: Request):
    """Update water quality thresholds."""
    water_quality_service = request.app.state.services['water_quality']
    water_quality_service.thresholds.update(thresholds)
    return {"updated": True, "thresholds": water_quality_service.thresholds}
