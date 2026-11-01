"""Unit tests for the filter-health service."""

import pytest

from app.services.filter_service import FilterService


@pytest.fixture()
def svc():
    return FilterService()


class TestHealthCalculation:
    def test_new_filter_high_health(self, svc):
        record = {
            "litres_processed": 0,
            "expected_litres": 6000,
            "operating_hours": 0,
            "expected_hours": 4380,
            "pressure_differential": 0.3,
            "initial_pressure_differential": 0.3,
            "flow_degradation": 0.0,
        }
        health = svc.calculate_health(record)
        assert health >= 95.0

    def test_half_used_filter_mid_health(self, svc):
        record = {
            "litres_processed": 3000,
            "expected_litres": 6000,
            "operating_hours": 2190,
            "expected_hours": 4380,
            "pressure_differential": 0.5,
            "initial_pressure_differential": 0.3,
            "flow_degradation": 0.15,
        }
        health = svc.calculate_health(record)
        assert 30.0 < health < 70.0

    def test_fully_used_filter_low_health(self, svc):
        record = {
            "litres_processed": 6500,
            "expected_litres": 6000,
            "operating_hours": 5000,
            "expected_hours": 4380,
            "pressure_differential": 1.0,
            "initial_pressure_differential": 0.3,
            "flow_degradation": 0.5,
        }
        health = svc.calculate_health(record)
        assert health < 20.0

    def test_health_never_negative(self, svc):
        record = {
            "litres_processed": 20000,
            "expected_litres": 6000,
            "operating_hours": 15000,
            "expected_hours": 4380,
            "pressure_differential": 3.0,
            "initial_pressure_differential": 0.3,
            "flow_degradation": 0.8,
        }
        health = svc.calculate_health(record)
        assert health >= 0.0

    def test_health_capped_at_100(self, svc):
        record = {
            "litres_processed": 0,
            "expected_litres": 6000,
            "operating_hours": 0,
            "expected_hours": 4380,
            "pressure_differential": 0.3,
            "initial_pressure_differential": 0.3,
            "flow_degradation": 0.0,
        }
        health = svc.calculate_health(record)
        assert health <= 100.0
