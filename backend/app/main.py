"""AQUASENSE-X FastAPI application entry point."""
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.logging import get_logger
from .core.exceptions import (
    AquaSenseError,
    SimulationError,
    SensorError,
    TreatmentError,
    SafetyError,
    AppValidationError,
    DatabaseError
)
from .database.connection import init_db, engine
from .simulation.engine import SimulationEngine
from .websocket.manager import ConnectionManager

# Import all route routers
from .api.routes import (
    system,
    sensors,
    simulation,
    water_quality,
    treatment,
    verification,
    safety,
    filters,
    recovery,
    alerts,
    analytics
)

# Import services
from .services.sensor_service import SensorService
from .services.water_quality_service import WaterQualityService
from .services.treatment_service import TreatmentService
from .services.verification_service import VerificationService
from .services.safety_service import SafetyService
from .services.filter_service import FilterService
from .services.recovery_service import RecoveryService
from .services.alert_service import AlertService

# Import repositories
from .repositories.sensor_repository import SensorRepository
from .repositories.event_repository import EventRepository
from .repositories.filter_repository import FilterRepository

from .database.connection import SessionLocal

logger = get_logger(__name__)
settings = get_settings()

# WebSocket connection manager
ws_manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting AQUASENSE-X application...")

    # Initialize database
    logger.info("Initializing database...")
    init_db()

    # Create database session factory
    db_session_factory = SessionLocal

    # Create repositories
    with db_session_factory() as db:
        sensor_repo = SensorRepository(db)
        event_repo = EventRepository(db)
        filter_repo = FilterRepository(db)

        # Initialize default filters if they don't exist
        filter_repo.ensure_default_filters()
        logger.info("Default filters initialized")

    # Create simulation engine (singleton)
    logger.info("Initializing simulation engine...")
    simulation_engine = SimulationEngine(settings, db_session_factory)

    # Add WebSocket broadcast listener
    async def broadcast_callback(data):
        await ws_manager.broadcast(data)

    simulation_engine.add_listener(broadcast_callback)

    # Create service instances
    logger.info("Initializing services...")

    # Need fresh DB sessions for each service
    def get_db():
        db = SessionLocal()
        try:
            return db
        finally:
            db.close()

    # Services
    sensor_service = SensorService(SensorRepository(get_db()), simulation_engine)
    water_quality_service = WaterQualityService()
    treatment_service = TreatmentService()
    verification_service = VerificationService()
    safety_service = SafetyService()
    filter_service = FilterService(FilterRepository(get_db()))
    recovery_service = RecoveryService()
    alert_service = AlertService(EventRepository(get_db()))

    services = {
        'sensor': sensor_service,
        'water_quality': water_quality_service,
        'treatment': treatment_service,
        'verification': verification_service,
        'safety': safety_service,
        'filter': filter_service,
        'recovery': recovery_service,
        'alert': alert_service,
    }

    # Store in app state
    app.state.simulation_engine = simulation_engine
    app.state.services = services
    app.state.ws_manager = ws_manager
    app.state.db_session_factory = db_session_factory

    logger.info("AQUASENSE-X application started successfully")

    yield  # Application runs

    # Shutdown
    logger.info("Shutting down AQUASENSE-X application...")

    # Stop simulation if running
    if simulation_engine.state.value in ['running', 'paused']:
        logger.info("Stopping simulation...")
        await simulation_engine.stop()

    logger.info("AQUASENSE-X application shut down")

# Create FastAPI app
app = FastAPI(
    title="AQUASENSE-X API",
    description="AI-Powered Intelligent Water Purification, Monitoring & Predictive Maintenance Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(AquaSenseError)
async def aquasense_error_handler(request: Request, exc: AquaSenseError):
    logger.error(f"AquaSense error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_type": exc.__class__.__name__}
    )

@app.exception_handler(SimulationError)
async def simulation_error_handler(request: Request, exc: SimulationError):
    logger.error(f"Simulation error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error_type": "SimulationError"}
    )

@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Database operation failed", "error_type": "DatabaseError"}
    )

# Include routers
API_V1_PREFIX = "/api/v1"

app.include_router(system.router, prefix=API_V1_PREFIX)
app.include_router(sensors.router, prefix=API_V1_PREFIX)
app.include_router(simulation.router, prefix=API_V1_PREFIX)
app.include_router(water_quality.router, prefix=API_V1_PREFIX)
app.include_router(treatment.router, prefix=API_V1_PREFIX)
app.include_router(verification.router, prefix=API_V1_PREFIX)
app.include_router(safety.router, prefix=API_V1_PREFIX)
app.include_router(filters.router, prefix=API_V1_PREFIX)
app.include_router(recovery.router, prefix=API_V1_PREFIX)
app.include_router(alerts.router, prefix=API_V1_PREFIX)
app.include_router(analytics.router, prefix=API_V1_PREFIX)

# WebSocket endpoint
@app.websocket("/api/v1/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await ws_manager.connect(websocket)
    try:
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo back for heartbeat
                await websocket.send_json({"type": "pong", "data": "alive"})
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "keepalive", "data": "ping"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "project": "AQUASENSE-X",
        "tagline": "Intelligent Water. Predictive Care. Trusted Purification.",
        "version": "1.0.0",
        "api_docs": "/docs",
        "health_check": "/api/v1/system/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
