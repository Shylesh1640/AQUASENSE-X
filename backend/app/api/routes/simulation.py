"""Simulation control routes."""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class SimulationConfig(BaseModel):
    scenario: str = "normal"
    seed: Optional[int] = None
    speed: float = 1.0

class ScenarioConfig(BaseModel):
    scenario: str

class SpeedConfig(BaseModel):
    multiplier: float

class FaultInjection(BaseModel):
    sensor_type: str
    fault_type: str

class SensorAdjustment(BaseModel):
    sensor_type: str
    value: float

@router.post("/start")
async def start_simulation(config: SimulationConfig, request: Request):
    """Start simulation."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value in ["running", "starting"]:
        raise HTTPException(400, "Simulation is already running")

    await sim_engine.start(
        scenario_type=config.scenario,
        seed=config.seed,
        speed=config.speed
    )

    return {
        "status": "started",
        "scenario": config.scenario,
        "speed": config.speed
    }

@router.post("/pause")
async def pause_simulation(request: Request):
    """Pause simulation."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value != "running":
        raise HTTPException(400, f"Cannot pause - simulation is {sim_engine.state.value}")

    await sim_engine.pause()
    return {"status": "paused"}

@router.post("/resume")
async def resume_simulation(request: Request):
    """Resume simulation."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value != "paused":
        raise HTTPException(400, f"Cannot resume - simulation is {sim_engine.state.value}")

    await sim_engine.resume()
    return {"status": "resumed"}

@router.post("/stop")
async def stop_simulation(request: Request):
    """Stop simulation."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value == "stopped":
        raise HTTPException(400, "Simulation is already stopped")

    await sim_engine.stop()
    return {"status": "stopped"}

@router.post("/reset")
async def reset_simulation(request: Request):
    """Reset simulation."""
    sim_engine = request.app.state.simulation_engine
    await sim_engine.reset()
    return {"status": "reset"}

@router.get("/status")
async def get_simulation_status(request: Request):
    """Get simulation status."""
    sim_engine = request.app.state.simulation_engine
    state = sim_engine.get_current_state()

    return {
        "state": sim_engine.state.value,
        "scenario": state.get('scenario', 'unknown'),
        "speed": sim_engine.speed_multiplier,
        "tick_count": sim_engine._tick_count,
        "elapsed_seconds": sim_engine._elapsed_seconds,
        "session_id": state.get('session_id'),
        "active_faults": state.get('active_faults', [])
    }

@router.post("/speed")
async def set_simulation_speed(speed_config: SpeedConfig, request: Request):
    """Set simulation speed multiplier."""
    sim_engine = request.app.state.simulation_engine

    if speed_config.multiplier not in [1.0, 2.0, 5.0, 10.0]:
        raise HTTPException(400, "Speed must be 1, 2, 5, or 10")

    sim_engine.set_speed(speed_config.multiplier)
    return {"speed": speed_config.multiplier}

@router.post("/scenario")
async def set_scenario(scenario_config: ScenarioConfig, request: Request):
    """Change simulation scenario."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value == "running":
        raise HTTPException(400, "Stop simulation before changing scenario")

    # Scenario will be applied on next start
    return {"scenario": scenario_config.scenario}

@router.post("/fault")
async def inject_fault(fault: FaultInjection, request: Request):
    """Inject a fault into simulation."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value not in ["running", "paused"]:
        raise HTTPException(400, "Simulation must be running or paused")

    from ...domain.enums import SensorType
    try:
        sensor_type = SensorType(fault.sensor_type)
    except ValueError:
        raise HTTPException(400, f"Invalid sensor type: {fault.sensor_type}")

    sim_engine.fault_injector.inject_sensor_fault(sensor_type, fault.fault_type)

    return {
        "injected": True,
        "sensor": fault.sensor_type,
        "fault": fault.fault_type
    }

@router.post("/adjust")
async def adjust_sensor(adjustment: SensorAdjustment, request: Request):
    """Manually adjust a sensor value."""
    sim_engine = request.app.state.simulation_engine

    if sim_engine.state.value not in ["running", "paused"]:
        raise HTTPException(400, "Simulation must be running or paused")

    from ...domain.enums import SensorType
    try:
        sensor_type = SensorType(adjustment.sensor_type)
    except ValueError:
        raise HTTPException(400, f"Invalid sensor type: {adjustment.sensor_type}")

    sim_engine.adjust_sensor(sensor_type, adjustment.value)

    return {
        "adjusted": True,
        "sensor": adjustment.sensor_type,
        "value": adjustment.value
    }
