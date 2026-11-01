import numpy as np
import pandas as pd
import os
from typing import Optional


class DatasetGenerator:
    """Generates synthetic filter degradation datasets for ML training.

    All data produced is clearly synthetic. Do not treat synthetic-data
    model performance as validated real-world accuracy.
    """

    FILTER_PARAMS = {
        "sediment": {"max_litres": 6000, "max_hours": 4380, "base_pressure": 0.3},
        "carbon": {"max_litres": 6000, "max_hours": 4380, "base_pressure": 0.2},
        "uf_membrane": {"max_litres": 8000, "max_hours": 8760, "base_pressure": 0.5},
        "ro_membrane": {"max_litres": 6000, "max_hours": 17520, "base_pressure": 1.0},
        "uv_lamp": {"max_litres": 50000, "max_hours": 8000, "base_pressure": 0.0},
    }

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    def generate_filter_dataset(
        self, n_samples: int = 1000, filter_type: str = "sediment"
    ) -> pd.DataFrame:
        """Generate a synthetic filter degradation dataset.

        Features
        --------
        cumulative_litres, operating_hours, avg_inlet_tds,
        avg_inlet_turbidity, pressure_differential, flow_rate_ratio,
        treatment_cycles, days_since_install.

        Target
        ------
        remaining_life_pct : float  (0–100)
        """
        params = self.FILTER_PARAMS.get(filter_type, self.FILTER_PARAMS["sediment"])
        rng = self.rng

        life_fraction = np.clip(rng.uniform(0.0, 1.2, n_samples), 0.0, 1.3)

        cumulative_litres = (
            life_fraction * params["max_litres"] * rng.uniform(0.8, 1.2, n_samples)
        )
        operating_hours = (
            life_fraction * params["max_hours"] * rng.uniform(0.7, 1.3, n_samples)
        )

        avg_inlet_tds = rng.normal(350, 150, n_samples).clip(50, 1200)
        avg_inlet_turbidity = rng.exponential(3, n_samples).clip(0.1, 50)

        base_p = max(params["base_pressure"], 0.01)
        pressure_differential = (
            base_p
            + (life_fraction ** 1.5) * base_p * 3
            + rng.normal(0, 0.05, n_samples)
        )
        pressure_differential = pressure_differential.clip(base_p * 0.5, base_p * 8)

        flow_rate_ratio = (
            1.0 - (life_fraction ** 1.3) * 0.6 + rng.normal(0, 0.03, n_samples)
        )
        flow_rate_ratio = flow_rate_ratio.clip(0.2, 1.05)

        treatment_cycles = (operating_hours / 0.5).astype(int) + rng.integers(
            0, 100, n_samples
        )
        days_since_install = (
            operating_hours / 12 * rng.uniform(0.8, 1.2, n_samples)
        ).clip(1, 1000)

        quality_factor = (
            1.0 + (avg_inlet_tds - 300) / 1000 + (avg_inlet_turbidity - 2) / 20
        )
        quality_factor = quality_factor.clip(0.7, 2.0)

        effective_usage = life_fraction * quality_factor
        remaining_life_pct = ((1.0 - effective_usage) * 100).clip(0, 100)
        remaining_life_pct = (remaining_life_pct + rng.normal(0, 2, n_samples)).clip(
            0, 100
        )

        return pd.DataFrame(
            {
                "cumulative_litres": cumulative_litres,
                "operating_hours": operating_hours,
                "avg_inlet_tds": avg_inlet_tds,
                "avg_inlet_turbidity": avg_inlet_turbidity,
                "pressure_differential": pressure_differential,
                "flow_rate_ratio": flow_rate_ratio,
                "treatment_cycles": treatment_cycles,
                "days_since_install": days_since_install,
                "remaining_life_pct": remaining_life_pct,
                "filter_type": filter_type,
                "is_synthetic": True,
            }
        )

    def generate_all_datasets(
        self, n_samples_each: int = 1000
    ) -> dict[str, pd.DataFrame]:
        datasets: dict[str, pd.DataFrame] = {}
        for ft in self.FILTER_PARAMS:
            datasets[ft] = self.generate_filter_dataset(n_samples_each, ft)
        return datasets

    def save_datasets(
        self, output_dir: str, n_samples_each: int = 1000
    ) -> dict[str, pd.DataFrame]:
        os.makedirs(output_dir, exist_ok=True)
        datasets = self.generate_all_datasets(n_samples_each)
        for name, df in datasets.items():
            df.to_csv(os.path.join(output_dir, f"{name}_dataset.csv"), index=False)
        return datasets
