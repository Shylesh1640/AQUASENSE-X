"""Unit tests for the machine-learning pipeline."""

import os
import shutil
import tempfile

import numpy as np
import pytest

from app.ml.dataset import DatasetGenerator
from app.ml.features import FEATURE_COLUMNS, TARGET_COLUMN, FeatureEngineer
from app.ml.training import ModelTrainer
from app.ml.inference import PredictionService
from app.ml.evaluation import ModelEvaluator


class TestDatasetGeneration:
    def test_correct_columns(self):
        gen = DatasetGenerator(seed=0)
        df = gen.generate_filter_dataset(100, "sediment")
        for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
            assert col in df.columns, f"Missing column {col}"

    def test_target_in_range(self):
        gen = DatasetGenerator(seed=1)
        df = gen.generate_filter_dataset(500, "carbon")
        assert df["remaining_life_pct"].min() >= 0.0
        assert df["remaining_life_pct"].max() <= 100.0

    def test_all_filter_types_generated(self):
        gen = DatasetGenerator(seed=2)
        datasets = gen.generate_all_datasets(50)
        assert len(datasets) == 5
        for ft, df in datasets.items():
            assert len(df) == 50

    def test_no_nan_in_features(self):
        gen = DatasetGenerator(seed=3)
        df = gen.generate_filter_dataset(200, "ro_membrane")
        for col in FEATURE_COLUMNS:
            assert df[col].isna().sum() == 0, f"NaN found in {col}"

    def test_synthetic_flag_set(self):
        gen = DatasetGenerator(seed=4)
        df = gen.generate_filter_dataset(10, "uv_lamp")
        assert df["is_synthetic"].all()


class TestFeatureEngineering:
    def test_prepare_features_shape(self):
        gen = DatasetGenerator(seed=5)
        df = gen.generate_filter_dataset(100, "sediment")
        fe = FeatureEngineer()
        X, y = fe.prepare_features(df)
        assert X.shape == (100, len(FEATURE_COLUMNS))
        assert y.shape == (100,)

    def test_prepare_single(self):
        fe = FeatureEngineer()
        data = {col: 1.0 for col in FEATURE_COLUMNS}
        X = fe.prepare_single(data)
        assert X.shape == (1, len(FEATURE_COLUMNS))


class TestModelTraining:
    def test_train_produces_model_file(self):
        tmpdir = tempfile.mkdtemp()
        try:
            trainer = ModelTrainer(model_dir=tmpdir)
            meta = trainer.train("sediment", n_samples=100, seed=10)
            assert os.path.exists(meta["model_path"])
            assert meta["is_synthetic_data"] is True
            assert meta["metrics"]["test_mae"] >= 0
        finally:
            shutil.rmtree(tmpdir)

    def test_train_all_produces_five_models(self):
        tmpdir = tempfile.mkdtemp()
        try:
            trainer = ModelTrainer(model_dir=tmpdir)
            results = trainer.train_all(n_samples=80)
            assert len(results) == 5
        finally:
            shutil.rmtree(tmpdir)


class TestInference:
    def test_predict_returns_expected_keys(self):
        tmpdir = tempfile.mkdtemp()
        try:
            trainer = ModelTrainer(model_dir=tmpdir)
            trainer.train("sediment", n_samples=100, seed=20)
            svc = PredictionService(model_dir=tmpdir)
            pred = svc.predict("sediment", {
                "cumulative_litres": 3000,
                "operating_hours": 2000,
                "avg_inlet_tds": 350,
                "avg_inlet_turbidity": 2.0,
                "pressure_differential": 0.5,
                "flow_rate_ratio": 0.8,
                "treatment_cycles": 4000,
                "days_since_install": 180,
            })
            assert "predicted_remaining_pct" in pred
            assert pred["predicted_remaining_pct"] is not None
            assert 0 <= pred["predicted_remaining_pct"] <= 100
            assert pred["is_synthetic_model"] is True
        finally:
            shutil.rmtree(tmpdir)

    def test_missing_model_returns_error(self):
        svc = PredictionService(model_dir="/nonexistent")
        pred = svc.predict("sediment", {"cumulative_litres": 100})
        assert pred["predicted_remaining_pct"] is None
        assert "error" in pred


class TestEvaluation:
    def test_evaluate_metrics(self):
        y_true = np.array([90, 70, 50, 30, 10], dtype=float)
        y_pred = np.array([88, 72, 48, 32, 12], dtype=float)
        metrics = ModelEvaluator.evaluate(y_true, y_pred)
        assert metrics["mae"] < 5
        assert metrics["rmse"] < 5
        assert metrics["r2"] > 0.95
