"""Output verification service."""
from datetime import datetime
from ..domain.schemas import VerificationResult
from ..domain.enums import VerificationStatus
from ..core.config import get_settings

class VerificationService:
    """Service for post-treatment output verification."""

    def __init__(self):
        self.settings = get_settings()
        self.latest_verification = None

        # Verification thresholds
        self.thresholds = {
            'outlet_tds_max': 50,  # ppm
            'outlet_ph_min': 6.5,
            'outlet_ph_max': 8.5,
            'outlet_turbidity_max': 0.5,  # NTU
            'min_tds_reduction_pct': 70,  # Must reduce TDS by at least 70%
        }

    def verify_output(self, inlet_readings: dict, outlet_readings: dict) -> VerificationResult:
        """Verify treatment output against independent verification thresholds."""
        outlet_tds = outlet_readings.get('tds', 0)
        outlet_ph = outlet_readings.get('ph', 7.0)
        outlet_turbidity = outlet_readings.get('turbidity', 0)
        outlet_temperature = outlet_readings.get('temperature', 25.0)

        inlet_tds = inlet_readings.get('tds', 300)

        # Calculate TDS reduction
        if inlet_tds > 0:
            tds_reduction_pct = ((inlet_tds - outlet_tds) / inlet_tds) * 100
        else:
            tds_reduction_pct = 0

        # Check each condition
        failures = []
        warnings = []

        # Critical checks
        if outlet_tds > self.thresholds['outlet_tds_max']:
            failures.append(f"Outlet TDS {outlet_tds:.1f} ppm exceeds limit {self.thresholds['outlet_tds_max']} ppm")

        if outlet_ph < self.thresholds['outlet_ph_min'] or outlet_ph > self.thresholds['outlet_ph_max']:
            failures.append(f"Outlet pH {outlet_ph:.2f} outside safe range {self.thresholds['outlet_ph_min']}-{self.thresholds['outlet_ph_max']}")

        if outlet_turbidity > self.thresholds['outlet_turbidity_max']:
            failures.append(f"Outlet turbidity {outlet_turbidity:.2f} NTU exceeds limit {self.thresholds['outlet_turbidity_max']} NTU")

        # Warning checks
        if tds_reduction_pct < self.thresholds['min_tds_reduction_pct']:
            warnings.append(f"TDS reduction {tds_reduction_pct:.1f}% below expected {self.thresholds['min_tds_reduction_pct']}%")

        if outlet_tds > self.thresholds['outlet_tds_max'] * 0.8:
            warnings.append(f"Outlet TDS approaching limit")

        # Determine status
        if failures:
            status = VerificationStatus.FAILED
            details = "VERIFICATION FAILED: " + "; ".join(failures)
        elif warnings:
            status = VerificationStatus.WARNING
            details = "Verification passed with warnings: " + "; ".join(warnings)
        elif all(k in outlet_readings for k in ['tds', 'ph', 'turbidity']):
            status = VerificationStatus.VERIFIED
            details = f"All parameters within acceptable limits. TDS reduction: {tds_reduction_pct:.1f}%"
        else:
            status = VerificationStatus.UNABLE_TO_VERIFY
            details = "Insufficient sensor data for verification"

        result = VerificationResult(
            status=status,
            outlet_tds=outlet_tds,
            outlet_ph=outlet_ph,
            outlet_turbidity=outlet_turbidity,
            outlet_temperature=outlet_temperature,
            inlet_tds=inlet_tds,
            tds_reduction_pct=tds_reduction_pct,
            details=details,
            timestamp=datetime.utcnow().isoformat()
        )

        self.latest_verification = result
        return result

    def get_latest_verification(self) -> VerificationResult:
        """Get the most recent verification result."""
        if self.latest_verification:
            return self.latest_verification
        else:
            return VerificationResult(
                status=VerificationStatus.UNABLE_TO_VERIFY,
                outlet_tds=0,
                outlet_ph=7.0,
                outlet_turbidity=0,
                outlet_temperature=25.0,
                inlet_tds=0,
                tds_reduction_pct=0,
                details="No verification data available",
                timestamp=datetime.utcnow().isoformat()
            )

    def update_thresholds(self, new_thresholds: dict):
        """Update verification thresholds."""
        self.thresholds.update(new_thresholds)

    def get_thresholds(self) -> dict:
        """Get current verification thresholds."""
        return self.thresholds.copy()
