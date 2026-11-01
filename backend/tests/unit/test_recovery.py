"""Unit tests for the RO recovery service."""

import pytest

from app.services.recovery_service import RecoveryService


@pytest.fixture()
def svc():
    return RecoveryService()


class TestMassBalance:
    def test_feed_equals_permeate_plus_reject(self, svc):
        result = svc.calculate_recovery(feed_flow_rate=2.0, ro_active=True, dt=1.0)
        feed = result["feed_volume"]
        perm = result["permeate_volume"]
        reject = result["reject_volume"]
        assert abs(feed - (perm + reject)) < 1e-6

    def test_recovery_ratio_applied(self, svc):
        svc.configure(recovery_ratio=0.6, reuse_pct=0.8, tank_capacity=50.0)
        result = svc.calculate_recovery(feed_flow_rate=2.0, ro_active=True, dt=1.0)
        assert abs(result["permeate_volume"] / result["feed_volume"] - 0.6) < 1e-6

    def test_no_recovery_when_ro_inactive(self, svc):
        result = svc.calculate_recovery(feed_flow_rate=2.0, ro_active=False, dt=1.0)
        assert result["reject_volume"] == 0.0
        assert result["permeate_volume"] == 0.0

    def test_reuse_accumulates(self, svc):
        svc.reset()
        svc.configure(recovery_ratio=0.5, reuse_pct=0.5, tank_capacity=100.0)
        svc.calculate_recovery(feed_flow_rate=2.0, ro_active=True, dt=1.0)
        summary = svc.get_summary()
        assert summary["total_reuse"] > 0

    def test_reuse_tank_does_not_overflow(self, svc):
        svc.reset()
        svc.configure(recovery_ratio=0.5, reuse_pct=1.0, tank_capacity=1.0)
        for _ in range(100):
            svc.calculate_recovery(feed_flow_rate=10.0, ro_active=True, dt=1.0)
        summary = svc.get_summary()
        assert summary["reuse_tank_level"] <= 1.0
