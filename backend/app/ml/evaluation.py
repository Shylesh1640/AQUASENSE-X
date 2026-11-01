import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class ModelEvaluator:
    """Compute evaluation metrics and generate human-readable reports."""

    @staticmethod
    def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
        return {
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
            "r2": float(r2_score(y_true, y_pred)),
            "max_error": float(np.max(np.abs(y_true - y_pred))),
            "mean_error": float(np.mean(y_pred - y_true)),
            "n_samples": len(y_true),
        }

    @staticmethod
    def generate_report(training_result: dict) -> str:
        metrics = training_result.get("metrics", {})
        lines = [
            f"Filter Type: {training_result.get('filter_type')}",
            f"Algorithm: {training_result.get('algorithm')}",
            f"Trained on: {training_result.get('n_samples')} synthetic samples",
            "Data: SYNTHETIC (not real-world validated)",
            "",
            "Test Metrics:",
            f"  MAE:  {metrics.get('test_mae', 0):.2f}%",
            f"  RMSE: {metrics.get('test_rmse', 0):.2f}%",
            f"  R²:   {metrics.get('test_r2', 0):.4f}",
            "",
            "WARNING: These metrics are based on synthetic data.",
            "Real-world performance may differ significantly.",
            "Do not rely on these predictions for safety decisions.",
        ]

        importances = training_result.get("feature_importances", {})
        if importances:
            lines.append("")
            lines.append("Feature Importances:")
            for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
                lines.append(f"  {feat}: {imp:.4f}")

        return "\n".join(lines)
