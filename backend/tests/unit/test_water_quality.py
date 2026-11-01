"""Unit tests for the water-quality assessment service."""

import pytest

from app.services.water_quality_service import WaterQualityService


@pytest.fixture()
def svc():
    return WaterQualityService()


def _readings(**overrides):
    base = {
        "tds": 250.0,
        "ph": 7.2,
        "turbidity": 0.5,
        "temperature": 25.0,
        "flow": 1.5,
        "pressure": 2.5,
    }
    base.update(overrides)
    return base


class TestTDSClassification:
    def test_normal(self, svc):
        result = svc.assess_quality(_readings(tds=200))
        tds_item = _find(result, "tds")
        assert tds_item["level"] == "NORMAL"

    def test_warning(self, svc):
        result = svc.assess_quality(_readings(tds=450))
        assert _find(result, "tds")["level"] == "WARNING"

    def test_critical(self, svc):
        result = svc.assess_quality(_readings(tds=800))
        assert _find(result, "tds")["level"] == "CRITICAL"


class TestPHClassification:
    def test_normal(self, svc):
        result = svc.assess_quality(_readings(ph=7.0))
        assert _find(result, "ph")["level"] == "NORMAL"

    def test_warning_acidic(self, svc):
        result = svc.assess_quality(_readings(ph=6.0))
        assert _find(result, "ph")["level"] == "WARNING"

    def test_critical_extreme(self, svc):
        result = svc.assess_quality(_readings(ph=3.0))
        assert _find(result, "ph")["level"] == "CRITICAL"


class TestTurbidityClassification:
    def test_normal(self, svc):
        result = svc.assess_quality(_readings(turbidity=0.3))
        assert _find(result, "turbidity")["level"] == "NORMAL"

    def test_warning(self, svc):
        result = svc.assess_quality(_readings(turbidity=3.0))
        assert _find(result, "turbidity")["level"] == "WARNING"

    def test_critical(self, svc):
        result = svc.assess_quality(_readings(turbidity=8.0))
        assert _find(result, "turbidity")["level"] == "CRITICAL"


class TestOverallAssessment:
    def test_all_normal_returns_normal(self, svc):
        result = svc.assess_quality(_readings())
        assert result["overall_level"] == "NORMAL"

    def test_one_critical_makes_overall_critical(self, svc):
        result = svc.assess_quality(_readings(tds=1000))
        assert result["overall_level"] == "CRITICAL"

    def test_explanation_present(self, svc):
        result = svc.assess_quality(_readings())
        assert "explanation" in result
        assert isinstance(result["explanation"], str)
        assert len(result["explanation"]) > 0


def _find(result: dict, param: str) -> dict:
    for p in result["parameters"]:
        if p["name"] == param:
            return p
    raise KeyError(f"{param} not found in assessment")
