"""Sensor service for managing sensor data."""
from typing import Optional, List
from datetime import datetime, timedelta
from ..domain.schemas import SensorReading
from ..domain.enums import SensorType
from ..repositories.sensor_repository import SensorRepository
from ..core.config import get_settings

class SensorService:
    """Service for sensor operations."""

    def __init__(self, sensor_repo: SensorRepository, simulation_engine=None):
        self.sensor_repo = sensor_repo
        self.simulation_engine = simulation_engine
        self.settings = get_settings()

    def get_current_readings(self) -> List[SensorReading]:
        """Get current readings from simulation engine or database."""
        if self.simulation_engine and self.simulation_engine.state.value in ['running', 'paused']:
            readings = self.simulation_engine.get_current_readings()
            return [
                SensorReading(
                    sensor_type=r['sensor_type'],
                    value=r['value'],
                    unit=r['unit'],
                    timestamp=r['timestamp'],
                    is_valid=r['is_valid'],
                    is_simulated=True
                )
                for r in readings
            ]
        else:
            # Return latest from database
            db_readings = self.sensor_repo.get_latest_readings()
            return [
                SensorReading(
                    sensor_type=SensorType(r.sensor_type),
                    value=r.value,
                    unit=r.unit,
                    timestamp=r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else r.timestamp,
                    is_valid=r.is_valid,
                    is_simulated=r.is_simulated
                )
                for r in db_readings
            ]

    def get_sensor_history(
        self,
        sensor_type: Optional[SensorType] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 100
    ) -> List[SensorReading]:
        """Get historical sensor readings."""
        db_readings = self.sensor_repo.get_history(
            sensor_type=sensor_type.value if sensor_type else None,
            start=start,
            end=end,
            limit=limit
        )
        return [
            SensorReading(
                sensor_type=SensorType(r.sensor_type),
                value=r.value,
                unit=r.unit,
                timestamp=r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else r.timestamp,
                is_valid=r.is_valid,
                is_simulated=r.is_simulated
            )
            for r in db_readings
        ]

    def get_sensor_config(self) -> dict:
        """Get sensor configuration and ranges."""
        return {
            'sensors': [
                {
                    'type': 'tds',
                    'name': 'TDS / Conductivity',
                    'unit': 'ppm',
                    'min': 0,
                    'max': 2000,
                    'normal_range': [0, 300],
                    'warning_range': [300, 600],
                    'critical_threshold': 600,
                },
                {
                    'type': 'ph',
                    'name': 'pH',
                    'unit': '',
                    'min': 0,
                    'max': 14,
                    'normal_range': [6.5, 8.5],
                    'warning_range': [5.5, 9.5],
                    'critical_threshold': None,
                },
                {
                    'type': 'turbidity',
                    'name': 'Turbidity',
                    'unit': 'NTU',
                    'min': 0,
                    'max': 100,
                    'normal_range': [0, 1],
                    'warning_range': [1, 5],
                    'critical_threshold': 5,
                },
                {
                    'type': 'temperature',
                    'name': 'Temperature',
                    'unit': '°C',
                    'min': 0,
                    'max': 50,
                    'normal_range': [10, 35],
                    'warning_range': [5, 45],
                    'critical_threshold': 45,
                },
                {
                    'type': 'flow',
                    'name': 'Flow Rate',
                    'unit': 'L/min',
                    'min': 0,
                    'max': 10,
                    'normal_range': [0.5, 3.0],
                    'warning_range': [0.2, 5.0],
                    'critical_threshold': 0.1,
                },
                {
                    'type': 'pressure',
                    'name': 'Pressure',
                    'unit': 'bar',
                    'min': 0,
                    'max': 10,
                    'normal_range': [1.0, 4.0],
                    'warning_range': [0.5, 6.0],
                    'critical_threshold': 6.0,
                },
            ]
        }

    def validate_reading(self, sensor_type: SensorType, value: float) -> bool:
        """Check if reading is within physical bounds."""
        bounds = {
            SensorType.TDS: (0, 2000),
            SensorType.PH: (0, 14),
            SensorType.TURBIDITY: (0, 100),
            SensorType.TEMPERATURE: (-10, 60),
            SensorType.FLOW: (0, 10),
            SensorType.PRESSURE: (0, 10),
        }
        min_val, max_val = bounds.get(sensor_type, (-1e10, 1e10))
        return min_val <= value <= max_val
