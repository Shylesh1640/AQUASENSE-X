"""Safety-critical tests for the dispensing controller.

The dispensing system MUST default to LOCKED and must lock whenever any
critical condition is invalid.  ML predictions must never override
the safety controller.
"""

import pytest

from app.services.safety_service import SafetyService


@pytest.fixture()
def svc():
    return SafetyService()


def _good_readings():
    return {
        "tds": {"value": 250.0, "is_valid": True},
        "ph": {"value": 7.0, "is_valid": True},
        "turbidity": {"value": 0.5, "is_valid": True},
        "temperature": {"value": 25.0, "is_valid": True},
        "flow": {"value": 1.5, "is_valid": True},
        "pressure": {"value": 2.5, "is_valid": True},
    }


def _good_treatment():
    return {
        "all_required_active": True,
        "any_stage_failed": False,
        "uv_operational": True,
    }


def _good_verification():
    return {"status": "VERIFIED"}


def _good_filters():
    return {"any_critical": False}


class TestDefaultState:
    def test_default_state_is_locked(self, svc):
        status = svc.get_status()
        assert status["dispensing"] == "LOCKED"


class TestSensorFailures:
    def test_invalid_tds_locks_dispensing(self, svc):
        readings = _good_readings()
        readings["tds"]["is_valid"] = False
        result = svc.evaluate_safety(readings, _good_treatment(), _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"
        assert any("tds" in r.lower() or "sensor" in r.lower() for r in result["lock_reasons"])

    def test_missing_ph_locks_dispensing(self, svc):
        readings = _good_readings()
        readings["ph"]["is_valid"] = False
        result = svc.evaluate_safety(readings, _good_treatment(), _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"

    def test_abnormal_pressure_locks_dispensing(self, svc):
        readings = _good_readings()
        readings["pressure"]["value"] = 8.0  # way above normal
        result = svc.evaluate_safety(readings, _good_treatment(), _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"

    def test_zero_flow_locks_dispensing(self, svc):
        readings = _good_readings()
        readings["flow"]["value"] = 0.0
        result = svc.evaluate_safety(readings, _good_treatment(), _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"


class TestTreatmentFailures:
    def test_treatment_stage_failure_locks_dispensing(self, svc):
        treatment = _good_treatment()
        treatment["any_stage_failed"] = True
        result = svc.evaluate_safety(_good_readings(), treatment, _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"

    def test_uv_fault_locks_dispensing(self, svc):
        treatment = _good_treatment()
        treatment["uv_operational"] = False
        result = svc.evaluate_safety(_good_readings(), treatment, _good_verification(), _good_filters())
        assert result["dispensing"] == "LOCKED"


class TestVerificationFailures:
    def test_failed_verification_locks_dispensing(self, svc):
        verification = {"status": "FAILED"}
        result = svc.evaluate_safety(_good_readings(), _good_treatment(), verification, _good_filters())
        assert result["dispensing"] == "LOCKED"


class TestAllConditionsMet:
    def test_all_conditions_met_allows_dispensing(self, svc):
        result = svc.evaluate_safety(
            _good_readings(), _good_treatment(), _good_verification(), _good_filters()
        )
        assert result["dispensing"] == "ALLOWED"
        assert len(result["lock_reasons"]) == 0


class TestMLCannotOverrideSafety:
    def test_ml_cannot_override_safety(self, svc):
        """Even if an ML prediction says the filter is fine, a failed
        verification must still lock dispensing."""
        readings = _good_readings()
        verification = {"status": "FAILED"}
        filters = {"any_critical": False, "ml_override_attempt": True}
        result = svc.evaluate_safety(readings, _good_treatment(), verification, filters)
        assert result["dispensing"] == "LOCKED"
