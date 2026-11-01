"""Safety controller routes."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/safety", tags=["Safety"])

@router.get("/status")
async def get_safety_status(request: Request):
    """Get dispensing safety status."""
    safety_service = request.app.state.services['safety']
    status = safety_service.get_status()
    return status.dict()

@router.post("/acknowledge")
async def acknowledge_safety(request: Request):
    """Acknowledge safety lock and attempt unlock."""
    safety_service = request.app.state.services['safety']
    result = safety_service.acknowledge_and_unlock()
    return result

@router.post("/lock")
async def force_lock(reason: dict, request: Request):
    """Force safety lock (emergency)."""
    safety_service = request.app.state.services['safety']
    safety_service.force_lock(reason.get('reason', 'Manual lock'))
    return {"locked": True}
