from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AquaSenseError(Exception):
    def __init__(self, message: str = "An internal error occurred", status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class SimulationError(AquaSenseError):
    def __init__(self, message: str = "Simulation error"):
        super().__init__(message=message, status_code=400)


class SensorError(AquaSenseError):
    def __init__(self, message: str = "Sensor error"):
        super().__init__(message=message, status_code=400)


class TreatmentError(AquaSenseError):
    def __init__(self, message: str = "Treatment error"):
        super().__init__(message=message, status_code=400)


class SafetyError(AquaSenseError):
    def __init__(self, message: str = "Safety constraint violation"):
        super().__init__(message=message, status_code=403)


class AppValidationError(AquaSenseError):
    def __init__(self, message: str = "Validation error"):
        super().__init__(message=message, status_code=422)


class DatabaseError(AquaSenseError):
    def __init__(self, message: str = "Database error"):
        super().__init__(message=message, status_code=500)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AquaSenseError)
    async def aquasense_error_handler(_request: Request, exc: AquaSenseError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": type(exc).__name__,
                "message": exc.message,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred",
                "status_code": 500,
            },
        )
