"""RO reject water recovery routes."""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/recovery", tags=["Recovery"])

@router.get("/summary")
async def get_recovery_summary(request: Request):
    """Get RO recovery statistics."""
    recovery_service = request.app.state.services['recovery']
    summary = recovery_service.get_summary()
    return summary.dict()

@router.post("/configure")
async def configure_recovery(config: dict, request: Request):
    """Configure recovery parameters."""
    recovery_service = request.app.state.services['recovery']

    recovery_service.configure(
        recovery_ratio=config.get('recovery_ratio'),
        reuse_percentage=config.get('reuse_percentage'),
        tank_capacity=config.get('tank_capacity')
    )

    return {"configured": True, "config": config}

@router.get("/history")
async def get_recovery_history(request: Request):
    """Get historical recovery data."""
    recovery_service = request.app.state.services['recovery']
    summary = recovery_service.get_summary()

    # Return current summary (in full implementation, query from DB)
    return [summary.dict()]

@router.get("/environmental-impact")
async def get_environmental_impact(request: Request):
    """Get environmental impact metrics."""
    recovery_service = request.app.state.services['recovery']
    impact = recovery_service.get_environmental_impact()
    return impact
