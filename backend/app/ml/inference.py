import glob
import json
import os
from typing import Optional

import numpy as np

# Optional ML dependencies
try:
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    joblib = None

from .features import FeatureEngineer


class PredictionService:
    """Load persisted models and serve filter-health predictions."""

    def __init__(self, model_dir: str = "models") -> None:
        self.model_dir = model_dir
        self.models: dict = {}
        self.metadata: dict = {}
        self.feature_engineer = FeatureEngineer()
        self._load_latest_models()

    # ------------------------------------------------------------------
    # Model management
    # ------------------------------------------------------------------

    def _load_latest_models(self) -> None:
        if not SKLEARN_AVAILABLE or not os.path.exists(self.model_dir):
            return

        for filter_type in [
            "sediment",
            "carbon",
            "uf_membrane",
            "ro_membrane",
            "uv_lamp",
        ]:
            meta_files = sorted(
                glob.glob(
                    os.path.join(self.model_dir, f"{filter_type}_*_meta.json")
                )
            )
            if not meta_files:
                continue
            latest_meta = meta_files[-1]
            with open(latest_meta) as f:
                meta = json.load(f)
            model_path = meta.get("model_path", "")
            if os.path.exists(model_path):
                self.models[filter_type] = joblib.load(model_path)
                self.metadata[filter_type] = meta

    def reload_models(self) -> None:
        self.models.clear()
        self.metadata.clear()
        self._load_latest_models()

    def is_model_available(self, filter_type: str) -> bool:
        return filter_type in self.models

    def get_model_info(self) -> dict:
        return {
            ft: {
                "version": m.get("version"),
                "trained_at": m.get("trained_at"),
                "metrics": m.get("metrics"),
                "is_synthetic": m.get("is_synthetic_data", True),
            }
            for ft, m in self.metadata.items()
        }

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict(self, filter_type: str, filter_data: dict) -> dict:
        """Return prediction dict for a single filter component."""
        if not SKLEARN_AVAILABLE:
            return {
                "predicted_remaining_pct": None,
                "predicted_remaining_days": None,
                "predicted_remaining_litres": None,
                "confidence": "unavailable",
                "model_version": None,
                "is_synthetic_model": True,
                "error": (
                    "ML predictions unavailable: scikit-learn not installed. "
                    "Install with: pip install scikit-learn>=1.3.0 joblib>=1.2.0"
                ),
            }

        if filter_type not in self.models:
            return {
                "predicted_remaining_pct": None,
                "predicted_remaining_days": None,
                "predicted_remaining_litres": None,
                "confidence": "no_model",
                "model_version": None,
                "is_synthetic_model": True,
                "error": (
                    f"No trained model for '{filter_type}'. "
                    "Use the training endpoint first."
                ),
            }

        X = self.feature_engineer.prepare_single(filter_data)
        prediction = float(np.clip(self.models[filter_type].predict(X)[0], 0.0, 100.0))
        meta = self.metadata[filter_type]

        days_installed = max(filter_data.get("days_since_install", 1), 0.01)
        used_pct = 100.0 - prediction
        if used_pct > 0:
            usage_rate = used_pct / days_installed
            remaining_days = prediction / usage_rate if usage_rate > 0 else 999.0
        else:
            remaining_days = 999.0

        litres = filter_data.get("cumulative_litres", 0)
        litres_per_day = litres / days_installed if days_installed > 0 else 0
        remaining_litres = remaining_days * litres_per_day

        test_mae = meta.get("metrics", {}).get("test_mae", 999)
        if test_mae < 5:
            confidence = "high"
        elif test_mae < 10:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "predicted_remaining_pct": round(prediction, 1),
            "predicted_remaining_days": round(remaining_days, 0),
            "predicted_remaining_litres": round(remaining_litres, 0),
            "confidence": confidence,
            "model_version": meta.get("version"),
            "is_synthetic_model": meta.get("is_synthetic_data", True),
            "feature_importances": meta.get("feature_importances", {}),
        }

    def predict_all(self, filters_data: dict[str, dict]) -> dict[str, dict]:
        return {ft: self.predict(ft, data) for ft, data in filters_data.items()}
