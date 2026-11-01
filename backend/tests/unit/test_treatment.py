"""Unit tests for the treatment service."""

import pytest

from app.services.treatment_service import TreatmentService


@pytest.fixture()
def svc():
    return TreatmentService()


def _inlet(tds=500.0, ph=7.0, turbidity=5.0, temperature=25.0, flow=1.5, pressure=2.5):
    return {
        "tds": tds,
        "ph": ph,
        "turbidity": turbidity,
        "temperature": temperature,
        "flow": flow,
        "pressure": pressure,
    }


class TestTreatmentSimulation:
    def test_ro_reduces_tds(self, svc):
        inlet = _inlet(tds=500)
        outlet = svc.simulate_full_treatment(inlet)
        assert outlet["tds"] < inlet["tds"], "RO should reduce TDS"

    def test_sediment_reduces_turbidity(self, svc):
        inlet = _inlet(turbidity=10)
        result = svc.simulate_stage_output("sediment", inlet, health_pct=100.0)
        assert result["turbidity"] < inlet["turbidity"]

    def test_remineralization_adds_tds(self, svc):
        low_tds_water = {"tds": 10, "ph": 6.5, "turbidity": 0.1, "temperature": 25, "flow": 1.5, "pressure": 2.5}
        result = svc.simulate_stage_output("remineralization", low_tds_water, health_pct=100.0)
        assert result["tds"] > low_tds_water["tds"]

    def test_full_treatment_produces_lower_tds(self, svc):
        inlet = _inlet(tds=600, turbidity=8)
        outlet = svc.simulate_full_treatment(inlet)
        assert outlet["tds"] < 100, f"Expected low TDS after full treatment, got {outlet['tds']}"

    def test_degraded_filter_less_effective(self, svc):
        inlet = _inlet(tds=500)
        healthy = svc.simulate_stage_output("ro", inlet, health_pct=100.0)
        degraded = svc.simulate_stage_output("ro", inlet, health_pct=30.0)
        assert degraded["tds"] > healthy["tds"], "Degraded RO should be less effective"
