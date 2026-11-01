"""Safety controller service - CRITICAL."""
from typing import List
from datetime import datetime
from ..domain.schemas import SafetyStatus, VerificationResult, TreatmentStatus
from ..domain.enums import DispensingStatus, VerificationStatus, StageStatus, TreatmentStage, QualityLevel
from ..core.config import get_settings
from ..core.logging import get_logger

logger = get_logger(__name__)

class SafetyService:
    """
    Safety-critical dispensing controller.

    IMPORTANT: This service implements fail-safe logic.
    Default state is LOCKED. Dispensing is only allowed when ALL safety conditions are met.
    """

    def __init__(self):
        self.settings = get_settings()
        self._dispensing_locked = True  # DEFAULT LOCKED
        self._lock_reasons = ["System initialization - safety checks not completed"]
        self._requires_acknowledgement = False
        self._last_evaluation = None

    def evaluate_safety(
        self,
        readings: dict,
        treatment_status: TreatmentStatus,
        verification: VerificationResult,
        filter_health: dict
    ) -> SafetyStatus:
        """
        Evaluate all safety conditions and determine dispensing permission.

        This is the CRITICAL safety function. It must default to LOCKED on any uncertainty.
        """
        lock_reasons = []
        required_actions = []

        # CONDITION 1: Critical sensors must be valid and within operating range
        critical_sensors = ['tds', 'ph', 'pressure', 'flow']
        for sensor in critical_sensors:
            if sensor not in readings or readings[sensor] is None:
                lock_reasons.append(f"Critical sensor {sensor.upper()} is missing or invalid")
                required_actions.append(f"Verify {sensor.upper()} sensor is functioning")
            elif sensor == 'tds' and (readings[sensor] < 0 or readings[sensor] > 2000):
                lock_reasons.append(f"TDS reading {readings[sensor]} is out of valid range")
                required_actions.append("Check TDS sensor calibration")
            elif sensor == 'ph' and (readings[sensor] < 0 or readings[sensor] > 14):
                lock_reasons.append(f"pH reading {readings[sensor]} is out of valid range")
                required_actions.append("Check pH sensor calibration")
            elif sensor == 'pressure' and readings[sensor] < 0.1:
                lock_reasons.append(f"System pressure {readings[sensor]} bar is critically low")
                required_actions.append("Check pump operation and inlet supply")
            elif sensor == 'pressure' and readings[sensor] > 8.0:
                lock_reasons.append(f"System pressure {readings[sensor]} bar is critically high")
                required_actions.append("Check for blockages; risk of membrane damage")
            elif sensor == 'flow' and readings[sensor] < 0.1:
                lock_reasons.append(f"Flow rate {readings[sensor]} L/min is critically low or zero")
                required_actions.append("Check for blockages or pump failure")

        # CONDITION 2: Required treatment stages must be operational
        required_stages = [TreatmentStage.SEDIMENT, TreatmentStage.CARBON, TreatmentStage.RO, TreatmentStage.UV]
        stage_status_map = {s.stage: s.status for s in treatment_status.stages}

        for stage in required_stages:
            status = stage_status_map.get(stage, StageStatus.FAILED)
            if status == StageStatus.FAILED:
                lock_reasons.append(f"Critical treatment stage {stage.value.upper()} has failed")
                required_actions.append(f"Repair or replace {stage.value.upper()} stage")
            elif status == StageStatus.INACTIVE and stage in [TreatmentStage.UV]:
                lock_reasons.append(f"Required treatment stage {stage.value.upper()} is inactive")
                required_actions.append(f"Activate {stage.value.upper()} stage")

        # CONDITION 3: Output verification must pass
        if verification.status == VerificationStatus.FAILED:
            lock_reasons.append(f"Output verification FAILED: {verification.details}")
            required_actions.append("Investigate treatment failure; check all filter stages")
        elif verification.status == VerificationStatus.UNABLE_TO_VERIFY:
            lock_reasons.append("Cannot verify output quality - verification sensors unavailable")
            required_actions.append("Restore output verification sensors")

        # CONDITION 4: UV system must be operational
        uv_status = stage_status_map.get(TreatmentStage.UV, StageStatus.FAILED)
        if uv_status == StageStatus.FAILED:
            lock_reasons.append("UV sterilization system is not operational")
            required_actions.append("Check UV lamp and power supply")

        # CONDITION 5: Critical filter health checks
        if filter_health:
            ro_health = filter_health.get('ro_membrane', {}).get('health_pct', 100)
            if ro_health < 10:
                lock_reasons.append(f"RO membrane health critically low ({ro_health:.0f}%)")
                required_actions.append("Replace RO membrane immediately")

            uv_health = filter_health.get('uv_lamp', {}).get('health_pct', 100)
            if uv_health < 10:
                lock_reasons.append(f"UV lamp health critically low ({uv_health:.0f}%)")
                required_actions.append("Replace UV lamp immediately")

        # CONDITION 6: Pressure/flow correlation check (detect anomalies)
        if 'pressure' in readings and 'flow' in readings:
            pressure = readings['pressure']
            flow = readings['flow']
            # If pressure is normal but flow is zero, something is blocked
            if pressure > 1.0 and flow < 0.1:
                lock_reasons.append("Pressure present but no flow detected - possible blockage")
                required_actions.append("Check for downstream blockages")

        # DETERMINE FINAL STATUS
        if lock_reasons:
            self._dispensing_locked = True
            self._lock_reasons = lock_reasons
            self._requires_acknowledgement = True
            dispensing = DispensingStatus.LOCKED
            logger.warning(f"Dispensing LOCKED: {len(lock_reasons)} safety conditions failed")
        else:
            self._dispensing_locked = False
            self._lock_reasons = []
            self._requires_acknowledgement = False
            dispensing = DispensingStatus.ALLOWED
            logger.info("Dispensing ALLOWED: All safety conditions met")

        self._last_evaluation = datetime.utcnow()

        return SafetyStatus(
            dispensing=dispensing,
            lock_reasons=lock_reasons,
            required_actions=required_actions,
            last_updated=datetime.utcnow().isoformat(),
            requires_acknowledgement=self._requires_acknowledgement
        )

    def acknowledge_and_unlock(self, operator_id: str = None) -> dict:
        """
        Acknowledge safety conditions and attempt to unlock.

        IMPORTANT: This does NOT force unlock. It only clears the acknowledgement requirement.
        Dispensing will remain locked until safety conditions are actually resolved.
        """
        if not self._lock_reasons:
            self._requires_acknowledgement = False
            return {
                'success': True,
                'message': 'No active safety locks. Dispensing is allowed.',
                'dispensing_locked': False,
            }
        else:
            self._requires_acknowledgement = False
            logger.info(f"Safety lock acknowledged by operator {operator_id or 'unknown'}")
            return {
                'success': False,
                'message': f"Acknowledged, but {len(self._lock_reasons)} safety conditions still prevent dispensing.",
                'dispensing_locked': True,
                'remaining_reasons': self._lock_reasons,
            }

    def get_status(self) -> SafetyStatus:
        """Get current safety status."""
        return SafetyStatus(
            dispensing=DispensingStatus.LOCKED if self._dispensing_locked else DispensingStatus.ALLOWED,
            lock_reasons=self._lock_reasons.copy(),
            required_actions=[],
            last_updated=self._last_evaluation.isoformat() if self._last_evaluation else datetime.utcnow().isoformat(),
            requires_acknowledgement=self._requires_acknowledgement
        )

    def force_lock(self, reason: str) -> None:
        """
        Force dispensing lock for emergency situations.

        This should only be called for critical system faults or manual emergency stop.
        """
        self._dispensing_locked = True
        if reason not in self._lock_reasons:
            self._lock_reasons.append(reason)
        self._requires_acknowledgement = True
        logger.critical(f"EMERGENCY LOCK ACTIVATED: {reason}")

    def is_dispensing_allowed(self) -> bool:
        """Quick check if dispensing is currently allowed."""
        return not self._dispensing_locked
