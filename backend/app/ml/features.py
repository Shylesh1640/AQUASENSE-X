import numpy as np
import pandas as pd
from typing import Optional

FEATURE_COLUMNS: list[str] = [
    "cumulative_litres",
    "operating_hours",
    "avg_inlet_tds",
    "avg_inlet_turbidity",
    "pressure_differential",
    "flow_rate_ratio",
    "treatment_cycles",
    "days_since_install",
]

TARGET_COLUMN: str = "remaining_life_pct"


class FeatureEngineer:
    """Extract and validate features for the filter-health model."""

    def __init__(self) -> None:
        self.feature_stats: dict[str, dict] = {}

    def prepare_features(
        self, df: pd.DataFrame
    ) -> tuple[np.ndarray, Optional[np.ndarray]]:
        """Return (X, y) arrays from a dataframe.

        y is ``None`` when the target column is absent (inference mode).
        """
        missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing feature columns: {missing}")

        X = np.nan_to_num(
            df[FEATURE_COLUMNS].values.astype(np.float64), nan=0.0
        )

        y: Optional[np.ndarray] = None
        if TARGET_COLUMN in df.columns:
            y = np.nan_to_num(
                df[TARGET_COLUMN].values.astype(np.float64), nan=50.0
            )

        return X, y

    def prepare_single(self, filter_data: dict) -> np.ndarray:
        """Build a 1-row feature matrix from a dictionary."""
        features = [float(filter_data.get(col, 0.0)) for col in FEATURE_COLUMNS]
        return np.array([features], dtype=np.float64)

    @staticmethod
    def get_feature_importance_names() -> list[str]:
        return FEATURE_COLUMNS.copy()
