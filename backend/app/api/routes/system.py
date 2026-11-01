"""System health and status routes."""
from fastapi import APIRouter, Request
from datetime import datetime
import time

router = APIRouter(prefix="/system", tags=["System"])

start_time = time.time()

@router.get("/health")
async def get_health():
    """System health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - start_time)
    }

@router.get("/status")
async def get_status(request: Request):
    """Get complete system status."""
    sim_engine = request.app.state.simulation_engine
    services = request.app.state.services

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "simulation": {
            "state": sim_engine.state.value if sim_engine else "stopped",
            "running": sim_engine.state.value == "running" if sim_engine else False
        },
        "database": "connected",
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - start_time),
        "services_initialized": services is not None
    }
