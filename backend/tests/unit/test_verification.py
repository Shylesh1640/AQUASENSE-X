"""Unit tests for the output verification service."""

import pytest

from app.services.verification_service import VerificationService


@pytest.fixture()
def svc():
    return VerificationService()


def _inlet():
    return {"tds": 500, "ph": 7.0, "turbidity": 5.0, "temperature": 25.0, "flow": 1.5, "pressure": 2.5}


class TestVerification:
    def test_good_outlet_verified(self, svc):
        inlet = _inlet()
        outlet = {"tds": 30, "ph": 7.0, "turbidity": 0.3, "temperature": 25.0, "flow": 1.2, "pressure": 2.0}
        result = svc.verify_output(inlet, outlet)
        assert result["status"] == "VERIFIED"

    def test_high_tds_outlet_fails(self, svc):
        inlet = _inlet()
        outlet = {"tds": 200, "ph": 7.0, "turbidity": 0.3, "temperature": 25.0, "flow": 1.2, "pressure": 2.0}
        result = svc.verify_output(inlet, outlet)
        assert result["status"] in ("WARNING", "FAILED")

    def test_high_turbidity_outlet_fails(self, svc):
        inlet = _inlet()
        outlet = {"tds": 30, "ph": 7.0, "turbidity": 4.0, "temperature": 25.0, "flow": 1.2, "pressure": 2.0}
        result = svc.verify_output(inlet, outlet)
        assert result["status"] in ("WARNING", "FAILED")

    def test_missing_sensor_unable_to_verify(self, svc):
        inlet = _inlet()
        outlet = {"tds": None, "ph": None, "turbidity": None, "temperature": 25.0, "flow": 1.2, "pressure": 2.0}
        result = svc.verify_output(inlet, outlet)
        assert result["status"] == "UNABLE_TO_VERIFY"

    def test_extreme_ph_warning(self, svc):
        inlet = _inlet()
        outlet = {"tds": 30, "ph": 5.0, "turbidity": 0.2, "temperature": 25.0, "flow": 1.2, "pressure": 2.0}
        result = svc.verify_output(inlet, outlet)
        assert result["status"] in ("WARNING", "FAILED")
