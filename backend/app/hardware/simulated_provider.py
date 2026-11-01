"""Simulated hardware provider using the AQUASENSE-X simulation engine."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..hardware.interfaces import HardwareProvider

if TYPE_CHECKING:
    from ..simulation.engine import SimulationEngine


class SimulatedSensorProvider(HardwareProvider):
    """Hardware provider that reads from the simulation engine.

    In simulation mode, all sensor readings come from the engine's
    synthetic data generators. Actuator commands are logged but have
    no physical effect.
    """

    def __init__(self, simulation_engine: SimulationEngine) -> None:
        self.engine = simulation_engine
        self._initialized = False

    async def initialize(self) -> None:
        self._initialized = True

    async def shutdown(self) -> None:
        self._initialized = False

    # -- Sensors -------------------------------------------------------------

    async def read_sensor(self, sensor_type: str) -> float:
        if not self._initialized:
            raise RuntimeError("Provider not initialized")

        readings = self.engine.get_current_readings()
        if sensor_type not in readings:
            raise ValueError(f"Unknown sensor type: {sensor_type}")

        return readings[sensor_type]

    async def get_all_readings(self) -> dict[str, float]:
        if not self._initialized:
            raise RuntimeError("Provider not initialized")

        return self.engine.get_current_readings()

    # -- Actuators -----------------------------------------------------------

    async def set_valve(self, valve_id: str, state: bool) -> bool:
        if not self._initialized:
            raise RuntimeError("Provider not initialized")

        # In simulation mode, log the command but don't affect state
        # Real hardware would communicate with ESP32/STM32 here
        return True

    async def set_pump(self, pump_id: str, state: bool, speed: float | None = None) -> bool:
        if not self._initialized:
            raise RuntimeError("Provider not initialized")

        # In simulation mode, log the command but don't affect state
        return True

    async def set_uv(self, state: bool) -> bool:
        if not self._initialized:
            raise RuntimeError("Provider not initialized")

        # In simulation mode, log the command but don't affect state
        return True
