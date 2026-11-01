"""Hardware abstraction layer for AQUASENSE-X.

Defines provider interfaces for sensors and actuators.
Allows transparent switching between simulated and real hardware.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class SensorProvider(ABC):
    """Interface for reading water-quality sensors."""

    @abstractmethod
    async def read_sensor(self, sensor_type: str) -> float:
        """Read a single sensor value.

        Args:
            sensor_type: Sensor identifier (e.g., "tds", "ph", "turbidity")

        Returns:
            Sensor reading as float

        Raises:
            ValueError: If sensor_type is unknown
            RuntimeError: If sensor read fails
        """
        ...

    @abstractmethod
    async def get_all_readings(self) -> dict[str, float]:
        """Read all available sensors.

        Returns:
            Dictionary mapping sensor_type to reading
        """
        ...

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize hardware connections."""
        ...

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up hardware resources."""
        ...


class ActuatorProvider(ABC):
    """Interface for controlling water-treatment actuators."""

    @abstractmethod
    async def set_valve(self, valve_id: str, state: bool) -> bool:
        """Open or close a solenoid valve.

        Args:
            valve_id: Valve identifier (e.g., "inlet", "ro_permeate", "reject")
            state: True to open, False to close

        Returns:
            True if command succeeded
        """
        ...

    @abstractmethod
    async def set_pump(self, pump_id: str, state: bool, speed: float | None = None) -> bool:
        """Control RO pump.

        Args:
            pump_id: Pump identifier (e.g., "ro_pump")
            state: True to enable, False to disable
            speed: Optional speed percentage (0.0–100.0)

        Returns:
            True if command succeeded
        """
        ...

    @abstractmethod
    async def set_uv(self, state: bool) -> bool:
        """Control UV sterilization module.

        Args:
            state: True to enable, False to disable

        Returns:
            True if command succeeded
        """
        ...

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize hardware connections."""
        ...

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up hardware resources."""
        ...


class HardwareProvider(SensorProvider, ActuatorProvider):
    """Combined interface for full hardware control."""
    pass
