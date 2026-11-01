"""Alert and event management service."""
from typing import List, Optional
from datetime import datetime, timedelta
from ..domain.schemas import AlertResponse as Alert, AlertCreate
from ..domain.enums import AlertSeverity, AlertCategory, QualityLevel, VerificationStatus, DispensingStatus, StageStatus
from ..repositories.event_repository import EventRepository
from ..core.logging import get_logger

logger = get_logger(__name__)

class AlertService:
    """Service for alert generation, management, and event tracking."""

    def __init__(self, event_repo: EventRepository):
        self.event_repo = event_repo
        self._cooldowns = {}  # key -> last_alert_time
        self.COOLDOWN_SECONDS = 30  # Prevent duplicate alerts within 30s

    def check_and_generate_alerts(
        self,
        readings: dict,
        treatment: dict,
        verification: dict,
        safety: dict,
        filters: dict
    ) -> List[Alert]:
        """
        Check all conditions and generate necessary alerts.

        Uses state-transition-based generation and cooldowns to prevent spam.
        """
        new_alerts = []

        # Check sensor quality alerts
        for sensor_type, value in readings.items():
            if value is None or not self._is_valid_reading(sensor_type, value):
                alert = self._create_alert_if_not_cooled(
                    f"sensor_invalid_{sensor_type}",
                    AlertSeverity.WARNING,
                    AlertCategory.SENSOR_FAULT,
                    f"Sensor: {sensor_type.upper()}",
                    f"{sensor_type.upper()} sensor reading is invalid or out of range",
                    f"Check {sensor_type.upper()} sensor connection and calibration"
                )
                if alert:
                    new_alerts.append(alert)

        # Check water quality alerts
        quality_level = readings.get('quality_level', QualityLevel.NORMAL)
        if quality_level == QualityLevel.CRITICAL:
            alert = self._create_alert_if_not_cooled(
                "water_quality_critical",
                AlertSeverity.CRITICAL,
                AlertCategory.WATER_QUALITY,
                "Water Quality",
                "Inlet water quality is CRITICAL - multiple parameters out of range",
                "Review inlet water source; consider additional pre-treatment"
            )
            if alert:
                new_alerts.append(alert)
        elif quality_level == QualityLevel.WARNING:
            alert = self._create_alert_if_not_cooled(
                "water_quality_warning",
                AlertSeverity.WARNING,
                AlertCategory.WATER_QUALITY,
                "Water Quality",
                "Inlet water quality parameters are outside optimal range",
                "Monitor treatment performance; check filters"
            )
            if alert:
                new_alerts.append(alert)

        # Check treatment stage failures
        if treatment and 'stages' in treatment:
            for stage_info in treatment['stages']:
                stage = stage_info.get('stage')
                status = stage_info.get('status')
                if status == StageStatus.FAILED.value:
                    alert = self._create_alert_if_not_cooled(
                        f"treatment_failure_{stage}",
                        AlertSeverity.CRITICAL,
                        AlertCategory.TREATMENT_FAILURE,
                        f"Treatment: {stage.upper()}",
                        f"Treatment stage {stage.upper()} has FAILED",
                        f"Inspect and repair {stage.upper()} stage; dispensing may be locked"
                    )
                    if alert:
                        new_alerts.append(alert)

        # Check output verification alerts
        if verification:
            status = verification.get('status')
            if status == VerificationStatus.FAILED.value:
                alert = self._create_alert_if_not_cooled(
                    "verification_failed",
                    AlertSeverity.CRITICAL,
                    AlertCategory.VERIFICATION_FAILED,
                    "Output Verification",
                    "POST-TREATMENT VERIFICATION FAILED - output quality unacceptable",
                    "Investigate all treatment stages; dispensing is locked for safety"
                )
                if alert:
                    new_alerts.append(alert)
            elif status == VerificationStatus.WARNING.value:
                alert = self._create_alert_if_not_cooled(
                    "verification_warning",
                    AlertSeverity.WARNING,
                    AlertCategory.VERIFICATION_FAILED,
                    "Output Verification",
                    "Output verification shows degraded performance",
                    "Check filter health and treatment stage performance"
                )
                if alert:
                    new_alerts.append(alert)

        # Check safety/dispensing alerts
        if safety:
            dispensing = safety.get('dispensing')
            if dispensing == DispensingStatus.LOCKED.value:
                lock_reasons = safety.get('lock_reasons', [])
                if lock_reasons:
                    alert = self._create_alert_if_not_cooled(
                        "dispensing_locked",
                        AlertSeverity.EMERGENCY,
                        AlertCategory.DISPENSING_LOCKED,
                        "Dispensing System",
                        f"DISPENSING LOCKED: {len(lock_reasons)} safety condition(s) failed",
                        "Review lock reasons and resolve all safety issues before dispensing"
                    )
                    if alert:
                        new_alerts.append(alert)

        # Check pressure anomalies
        pressure = readings.get('pressure', 0)
        if pressure < 0.3:
            alert = self._create_alert_if_not_cooled(
                "pressure_low",
                AlertSeverity.CRITICAL,
                AlertCategory.PRESSURE_ANOMALY,
                "Hydraulics",
                f"System pressure critically low ({pressure:.2f} bar)",
                "Check pump operation, inlet supply, and for leaks"
            )
            if alert:
                new_alerts.append(alert)
        elif pressure > 6.0:
            alert = self._create_alert_if_not_cooled(
                "pressure_high",
                AlertSeverity.CRITICAL,
                AlertCategory.PRESSURE_ANOMALY,
                "Hydraulics",
                f"System pressure critically high ({pressure:.2f} bar)",
                "Check for blockages; risk of membrane damage"
            )
            if alert:
                new_alerts.append(alert)

        # Check flow anomalies
        flow = readings.get('flow', 0)
        if flow < 0.1:
            alert = self._create_alert_if_not_cooled(
                "flow_low",
                AlertSeverity.CRITICAL,
                AlertCategory.FLOW_ANOMALY,
                "Hydraulics",
                f"Flow rate critically low ({flow:.2f} L/min)",
                "Check for blockages, filter clogging, or pump failure"
            )
            if alert:
                new_alerts.append(alert)

        # Check filter health alerts
        if filters:
            for component, filter_info in filters.items():
                health = filter_info.get('health_pct', 100)
                if health < 20:
                    alert = self._create_alert_if_not_cooled(
                        f"filter_critical_{component}",
                        AlertSeverity.CRITICAL,
                        AlertCategory.FILTER_MAINTENANCE,
                        f"Filter: {component.upper()}",
                        f"{component.replace('_', ' ').upper()} health critically low ({health:.0f}%)",
                        f"URGENT: Replace {component.replace('_', ' ')} immediately"
                    )
                    if alert:
                        new_alerts.append(alert)
                elif health < 40:
                    alert = self._create_alert_if_not_cooled(
                        f"filter_replace_{component}",
                        AlertSeverity.WARNING,
                        AlertCategory.FILTER_MAINTENANCE,
                        f"Filter: {component.upper()}",
                        f"{component.replace('_', ' ').upper()} needs replacement soon ({health:.0f}%)",
                        f"Schedule replacement for {component.replace('_', ' ')}"
                    )
                    if alert:
                        new_alerts.append(alert)

        # Save new alerts to database
        for alert in new_alerts:
            self.event_repo.save_alert(
                severity=alert.severity.value,
                category=alert.category.value,
                source=alert.source,
                description=alert.description,
                recommended_action=alert.recommended_action
            )

        return new_alerts

    def _create_alert_if_not_cooled(
        self,
        key: str,
        severity: AlertSeverity,
        category: AlertCategory,
        source: str,
        description: str,
        action: str
    ) -> Optional[Alert]:
        """Create alert only if cooldown period has passed."""
        now = datetime.utcnow()
        last_time = self._cooldowns.get(key)

        if last_time and (now - last_time).total_seconds() < self.COOLDOWN_SECONDS:
            return None  # Still in cooldown

        # Update cooldown
        self._cooldowns[key] = now

        return Alert(
            id=0,  # Will be assigned by DB
            timestamp=now.isoformat(),
            severity=severity,
            category=category,
            source=source,
            description=description,
            recommended_action=action,
            acknowledged=False,
            resolved=False
        )

    def _is_valid_reading(self, sensor_type: str, value: float) -> bool:
        """Check if sensor reading is within valid physical range."""
        ranges = {
            'tds': (0, 2000),
            'ph': (0, 14),
            'turbidity': (0, 100),
            'temperature': (-10, 60),
            'flow': (0, 10),
            'pressure': (0, 10),
        }
        min_val, max_val = ranges.get(sensor_type, (-1e10, 1e10))
        return min_val <= value <= max_val

    def get_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        category: Optional[AlertCategory] = None,
        acknowledged: Optional[bool] = None,
        resolved: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Alert]:
        """Get alerts with optional filtering."""
        db_alerts, total = self.event_repo.get_alerts(
            severity=severity.value if severity else None,
            category=category.value if category else None,
            acknowledged=acknowledged,
            resolved=resolved,
            limit=limit,
            offset=offset
        )

        return [self._alert_from_db(a) for a in db_alerts]

    def acknowledge_alert(self, alert_id: int) -> bool:
        """Acknowledge an alert."""
        return self.event_repo.acknowledge_alert(alert_id)

    def resolve_alert(self, alert_id: int) -> bool:
        """Mark an alert as resolved."""
        return self.event_repo.resolve_alert(alert_id)

    def get_event_timeline(self, limit: int = 100) -> list:
        """Get recent system events."""
        events = self.event_repo.get_events(limit=limit)
        return [
            {
                'id': e.id,
                'timestamp': e.timestamp.isoformat() if isinstance(e.timestamp, datetime) else e.timestamp,
                'event_type': e.event_type,
                'source': e.source,
                'description': e.description,
            }
            for e in events
        ]

    def _alert_from_db(self, db_alert) -> Alert:
        """Convert database alert to schema."""
        return Alert(
            id=db_alert.id,
            timestamp=db_alert.timestamp.isoformat() if isinstance(db_alert.timestamp, datetime) else db_alert.timestamp,
            severity=AlertSeverity(db_alert.severity),
            category=AlertCategory(db_alert.category),
            source=db_alert.source,
            description=db_alert.description,
            recommended_action=db_alert.recommended_action,
            acknowledged=db_alert.acknowledged,
            acknowledged_at=db_alert.acknowledged_at.isoformat() if db_alert.acknowledged_at else None,
            resolved=db_alert.resolved,
            resolved_at=db_alert.resolved_at.isoformat() if db_alert.resolved_at else None
        )

    def get_alert_summary(self) -> dict:
        """Get summary statistics for alerts."""
        total = self.event_repo.count_alerts()
        critical = self.event_repo.count_alerts(severity=AlertSeverity.CRITICAL.value)
        warnings = self.event_repo.count_alerts(severity=AlertSeverity.WARNING.value)
        unacknowledged = self.event_repo.count_alerts(acknowledged=False)

        return {
            'total_alerts': total,
            'critical_alerts': critical,
            'warnings': warnings,
            'unacknowledged': unacknowledged,
        }
