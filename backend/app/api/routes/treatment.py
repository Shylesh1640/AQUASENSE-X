"""Treatment process routes."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/treatment", tags=["Treatment"])

@router.get("/status")
async def get_treatment_status(request: Request):
    """Get current treatment status."""
    sim_engine = request.app.state.simulation_engine
    sensor_service = request.app.state.services['sensor']
    treatment_service = request.app.state.services['treatment']

    readings = sensor_service.get_current_readings()
    inlet_readings = {r.sensor_type.value: r.value for r in readings}

    status = treatment_service.get_treatment_status(inlet_readings, sim_engine)
    return status.dict()

@router.post("/configure")
async def configure_treatment(config: dict, request: Request):
    """Configure treatment parameters."""
    treatment_service = request.app.state.services['treatment']

    # Apply configuration to treatment service
    # This would update treatment coefficients or stage settings

    return {"configured": True, "config": config}

@router.get("/stages/{stage}")
async def get_stage_details(stage: str, request: Request):
    """Get detailed information about a treatment stage."""
    treatment_service = request.app.state.services['treatment']

    from ...domain.enums import TreatmentStage
    try:
        stage_enum = TreatmentStage(stage)
        details = treatment_service.get_stage_details(stage_enum)
        return details
    except ValueError:
        return {"error": f"Invalid stage: {stage}"}
