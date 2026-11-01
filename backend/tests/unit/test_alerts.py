"""Unit tests for the alert service."""

import time

import pytest

from app.services.alert_service import AlertService


@pytest.fixture()
def svc():
    return AlertService()


class TestAlertGeneration:
    def test_critical_tds_generates_alert(self, svc):
        readings = {"tds": {"value": 900, "is_valid": True, "level": "CRITICAL"}}
        alerts = svc.check_and_generate_alerts(
            readings=readings,
            treatment={"any_stage_failed": False},
            verification={"status": "VERIFIED"},
            safety={"dispensing": "ALLOWED"},
            filters={"any_critical": False},
        )
        assert len(alerts) > 0
        assert any("tds" in a["source"].lower() for a in alerts)

    def test_treatment_failure_generates_alert(self, svc):
        alerts = svc.check_and_generate_alerts(
            readings={},
            treatment={"any_stage_failed": True, "failed_stages": ["ro"]},
            verification={"status": "VERIFIED"},
            safety={"dispensing": "LOCKED"},
            filters={"any_critical": False},
        )
        assert len(alerts) > 0

    def test_verification_failure_generates_alert(self, svc):
        alerts = svc.check_and_generate_alerts(
            readings={},
            treatment={"any_stage_failed": False},
            verification={"status": "FAILED"},
            safety={"dispensing": "LOCKED"},
            filters={"any_critical": False},
        )
        assert len(alerts) > 0


class TestDeduplication:
    def test_duplicate_alert_suppressed_within_cooldown(self, svc):
        svc.COOLDOWN_SECONDS = 60
        readings = {"tds": {"value": 900, "is_valid": True, "level": "CRITICAL"}}
        kwargs = dict(
            readings=readings,
            treatment={"any_stage_failed": False},
            verification={"status": "VERIFIED"},
            safety={"dispensing": "ALLOWED"},
            filters={"any_critical": False},
        )
        first = svc.check_and_generate_alerts(**kwargs)
        second = svc.check_and_generate_alerts(**kwargs)
        assert len(second) == 0, "Duplicate alert should be suppressed"


class TestAcknowledgeResolve:
    def test_acknowledge_alert(self, svc):
        readings = {"tds": {"value": 900, "is_valid": True, "level": "CRITICAL"}}
        alerts = svc.check_and_generate_alerts(
            readings=readings,
            treatment={"any_stage_failed": False},
            verification={"status": "VERIFIED"},
            safety={"dispensing": "ALLOWED"},
            filters={"any_critical": False},
        )
        aid = alerts[0]["id"]
        svc.acknowledge_alert(aid)
        alert = svc.get_alert(aid)
        assert alert["acknowledged"] is True

    def test_resolve_alert(self, svc):
        readings = {"tds": {"value": 900, "is_valid": True, "level": "CRITICAL"}}
        alerts = svc.check_and_generate_alerts(
            readings=readings,
            treatment={"any_stage_failed": False},
            verification={"status": "VERIFIED"},
            safety={"dispensing": "ALLOWED"},
            filters={"any_critical": False},
        )
        aid = alerts[0]["id"]
        svc.resolve_alert(aid)
        alert = svc.get_alert(aid)
        assert alert["resolved"] is True
