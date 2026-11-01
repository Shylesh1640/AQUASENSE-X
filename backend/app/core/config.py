from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class SensorRange:
    def __init__(self, min_val: float, max_val: float, unit: str, warning_low: float, warning_high: float, critical_low: float, critical_high: float):
        self.min_val = min_val
        self.max_val = max_val
        self.unit = unit
        self.warning_low = warning_low
        self.warning_high = warning_high
        self.critical_low = critical_low
        self.critical_high = critical_high


SENSOR_RANGES = {
    "TDS": SensorRange(0, 2000, "ppm", 50, 500, 0, 1000),
    "PH": SensorRange(0, 14, "pH", 6.5, 8.5, 5.0, 10.0),
    "TURBIDITY": SensorRange(0, 100, "NTU", 0, 4, 0, 10),
    "TEMPERATURE": SensorRange(0, 60, "°C", 10, 35, 5, 45),
    "FLOW": SensorRange(0, 10, "L/min", 0.5, 5.0, 0.1, 8.0),
    "PRESSURE": SensorRange(0, 10, "bar", 1.0, 6.0, 0.5, 8.0),
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "AQUASENSE-X"
    PROJECT_DESCRIPTION: str = "Intelligent Water Purification Monitoring & Predictive Maintenance Platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./aquasense.db"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "aquasense.log"

    SIMULATION_INTERVAL_MS: int = 1000
    SIMULATION_DEFAULT_SEED: int = 42
    SIMULATION_MAX_SPEED: int = 10
    SIMULATION_HISTORY_RETENTION_HOURS: int = 168

    TREATMENT_SEDIMENT_EFFICIENCY: float = Field(default=0.85, description="Sediment filter removal efficiency for turbidity")
    TREATMENT_CARBON_EFFICIENCY: float = Field(default=0.70, description="Carbon filter removal efficiency for organics")
    TREATMENT_UF_EFFICIENCY: float = Field(default=0.90, description="UF membrane particle removal efficiency")
    TREATMENT_RO_REJECTION: float = Field(default=0.95, description="RO membrane TDS rejection ratio")
    TREATMENT_UV_INACTIVATION: float = Field(default=0.9999, description="UV disinfection log reduction")
    TREATMENT_REMINERALIZATION_TDS_ADD: float = Field(default=30.0, description="TDS added by remineralization in ppm")

    RO_RECOVERY_RATIO: float = Field(default=0.40, description="RO permeate recovery ratio (feed basis)")
    RO_REJECT_REUSE_FRACTION: float = Field(default=0.50, description="Fraction of reject directed to non-potable reuse")

    FILTER_SEDIMENT_LIFE_HOURS: float = 2000
    FILTER_CARBON_LIFE_HOURS: float = 2000
    FILTER_UF_LIFE_HOURS: float = 4000
    FILTER_RO_LIFE_HOURS: float = 6000
    FILTER_UV_LIFE_HOURS: float = 8000

    FILTER_SEDIMENT_LIFE_LITRES: float = 5000
    FILTER_CARBON_LIFE_LITRES: float = 5000
    FILTER_UF_LIFE_LITRES: float = 8000
    FILTER_RO_LIFE_LITRES: float = 10000
    FILTER_UV_LIFE_LITRES: float = 15000

    DISPENSING_MIN_FLOW: float = Field(default=0.2, description="Minimum flow rate (L/min) to allow dispensing")
    DISPENSING_MAX_TDS: float = Field(default=500, description="Maximum outlet TDS (ppm) to allow dispensing")
    DISPENSING_MIN_PH: float = Field(default=6.0, description="Minimum outlet pH to allow dispensing")
    DISPENSING_MAX_PH: float = Field(default=9.0, description="Maximum outlet pH to allow dispensing")
    DISPENSING_MAX_TURBIDITY: float = Field(default=5.0, description="Maximum outlet turbidity (NTU) to allow dispensing")
    DISPENSING_MIN_PRESSURE: float = Field(default=0.5, description="Minimum system pressure (bar) to allow dispensing")

    ALERT_COOLDOWN_SECONDS: int = Field(default=60, description="Minimum seconds between duplicate alerts")
    ALERT_MAX_ACTIVE: int = Field(default=100, description="Maximum active (unresolved) alerts before oldest auto-resolve")

    ML_MODEL_DIR: str = "ml_models"
    ML_MIN_TRAINING_SAMPLES: int = 100
    ML_TEST_SPLIT: float = 0.2
    ML_RANDOM_STATE: int = 42

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()


_settings: Settings | None = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
