import json
import os
from datetime import datetime, timezone

import numpy as np

# Optional ML dependencies
try:
    import joblib
    from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    joblib = None
    GradientBoostingRegressor = None
    RandomForestRegressor = None
    mean_absolute_error = None
    mean_squared_error = None
    r2_score = None
    train_test_split = None

from .dataset import DatasetGenerator
from .features import FEATURE_COLUMNS, FeatureEngineer


class ModelTrainer:
    """Train and persist filter-health prediction models."""

    def __init__(self, model_dir: str = "models") -> None:
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        self.feature_engineer = FeatureEngineer()

    def train(
        self,
        filter_type: str = "sediment",
        n_samples: int = 1000,
        algorithm: str = "random_forest",
        test_size: float = 0.2,
        seed: int = 42,
    ) -> dict:
        """Train a model for *filter_type* and return its metadata dict."""
        if not SKLEARN_AVAILABLE:
            raise RuntimeError(
                "scikit-learn is not installed. ML training is unavailable. "
                "Install with: pip install scikit-learn>=1.3.0 joblib>=1.2.0"
            )

        generator = DatasetGenerator(seed=seed)
        df = generator.generate_filter_dataset(n_samples, filter_type)

        X, y = self.feature_engineer.prepare_features(df)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=seed
        )

        if algorithm == "gradient_boosting":
            model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                min_samples_split=5,
                random_state=seed,
            )
        else:
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=seed,
                n_jobs=-1,
            )

        model.fit(X_train, y_train)

        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)

        metrics = {
            "train_mae": float(mean_absolute_error(y_train, y_pred_train)),
            "train_rmse": float(np.sqrt(mean_squared_error(y_train, y_pred_train))),
            "train_r2": float(r2_score(y_train, y_pred_train)),
            "test_mae": float(mean_absolute_error(y_test, y_pred_test)),
            "test_rmse": float(np.sqrt(mean_squared_error(y_test, y_pred_test))),
            "test_r2": float(r2_score(y_test, y_pred_test)),
            "n_train": len(X_train),
            "n_test": len(X_test),
        }

        importances = dict(
            zip(FEATURE_COLUMNS, model.feature_importances_.tolist())
        )

        version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        model_filename = f"{filter_type}_{algorithm}_{version}.joblib"
        model_path = os.path.join(self.model_dir, model_filename)
        joblib.dump(model, model_path)

        metadata: dict = {
            "filter_type": filter_type,
            "algorithm": algorithm,
            "version": version,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "metrics": metrics,
            "feature_importances": importances,
            "n_samples": n_samples,
            "is_synthetic_data": True,
            "model_path": model_path,
            "features": FEATURE_COLUMNS,
        }

        meta_path = os.path.join(
            self.model_dir, f"{filter_type}_{algorithm}_{version}_meta.json"
        )
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def train_all(self, n_samples: int = 1000) -> dict[str, dict]:
        results: dict[str, dict] = {}
        for ft in [
            "sediment",
            "carbon",
            "uf_membrane",
            "ro_membrane",
            "uv_lamp",
        ]:
            results[ft] = self.train(ft, n_samples)
        return results
