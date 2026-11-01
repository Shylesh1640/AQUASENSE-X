"""Unit tests for the simulated sensor models."""

import math

import numpy as np
import pytest

from app.simulation.sensor_models import (
    FlowSensor,
    PHSensor,
    PressureSensor,
    SensorModel,
    TDSSensor,
    TemperatureSensor,
    TurbiditySensor,
)


@pytest.fixture()
def rng():
    return np.random.default_rng(42)


class TestTDSSensor:
    def test_generates_within_range(self, rng):
        sensor = TDSSensor()
        for _ in range(100):
            v = sensor.generate(elapsed_seconds=1.0, scenario_params={}, rng=rng)
            assert 0 <= v <= 2000, f"TDS {v} out of physical range"

    def test_noise_applied(self, rng):
        sensor = TDSSensor(noise_std=5.0)
        vals = [sensor.generate(1.0, {}, rng) for _ in range(200)]
        assert max(vals) != min(vals), "All readings identical — no noise"


class TestPHSensor:
    def test_generates_within_range(self, rng):
        sensor = PHSensor()
        for _ in range(100):
            v = sensor.generate(1.0, {}, rng)
            assert 0 <= v <= 14, f"pH {v} out of range"

    def test_baseline_near_neutral(self, rng):
        sensor = PHSensor(base_value=7.0, noise_std=0.05)
        vals = [sensor.generate(1.0, {}, rng) for _ in range(200)]
        assert 6.0 < np.mean(vals) < 8.0


class TestTurbiditySensor:
    def test_generates_positive(self, rng):
        sensor = TurbiditySensor()
        for _ in range(100):
            v = sensor.generate(1.0, {}, rng)
            assert v >= 0, f"Turbidity negative: {v}"


class TestTemperatureSensor:
    def test_reasonable_range(self, rng):
        sensor = TemperatureSensor()
        for _ in range(100):
            v = sensor.generate(1.0, {}, rng)
            assert -10 <= v <= 60, f"Temp {v} unreasonable"


class TestFlowSensor:
    def test_generates_positive(self, rng):
        sensor = FlowSensor()
        for _ in range(50):
            v = sensor.generate(1.0, {}, rng)
            assert v >= 0, f"Flow negative: {v}"


class TestPressureSensor:
    def test_generates_positive(self, rng):
        sensor = PressureSensor()
        for _ in range(50):
            v = sensor.generate(1.0, {}, rng)
            assert v >= 0, f"Pressure negative: {v}"


class TestFaultInjection:
    def test_stuck_fault_returns_same_value(self, rng):
        sensor = TDSSensor()
        sensor.inject_fault("stuck")
        vals = {sensor.generate(float(i), {}, rng) for i in range(20)}
        assert len(vals) == 1, "Stuck fault should produce identical readings"

    def test_dead_sensor_returns_nan(self, rng):
        sensor = PHSensor()
        sensor.inject_fault("dead")
        v = sensor.generate(1.0, {}, rng)
        assert v is None or (isinstance(v, float) and math.isnan(v))

    def test_clear_fault_restores_normal(self, rng):
        sensor = TDSSensor(noise_std=3.0)
        sensor.inject_fault("stuck")
        sensor.clear_fault()
        vals = [sensor.generate(float(i), {}, rng) for i in range(50)]
        assert len(set(vals)) > 1, "After clearing, readings should vary"
