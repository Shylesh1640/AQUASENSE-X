"""RO reject water recovery service."""
from ..domain.schemas import RecoverySummary
from ..core.config import get_settings

class RecoveryService:
    """Service for tracking RO reject water recovery and reuse."""

    def __init__(self):
        self.settings = get_settings()

        # Configuration
        self.recovery_ratio = 0.50  # 50% of feed becomes permeate, 50% becomes reject
        self.reuse_percentage = 60.0  # 60% of reject is routed to non-potable reuse
        self.reuse_tank_capacity = 50.0  # litres
        self.reuse_tank_level = 0.0

        # Cumulative tracking
        self.total_feed = 0.0
        self.total_permeate = 0.0
        self.total_reject = 0.0
        self.total_reuse = 0.0

    def calculate_recovery(
        self,
        feed_flow_rate: float,
        ro_active: bool,
        dt: float
    ) -> RecoverySummary:
        """
        Calculate RO recovery for a time interval.

        Args:
            feed_flow_rate: Feed water flow rate in L/min
            ro_active: Whether RO stage is currently active
            dt: Time interval in seconds

        Returns:
            RecoverySummary with updated statistics
        """
        if not ro_active or feed_flow_rate <= 0:
            # RO not running, no recovery happening
            return self.get_summary()

        # Calculate volumes for this interval
        dt_minutes = dt / 60.0
        feed_volume = feed_flow_rate * dt_minutes

        # Mass balance: Feed = Permeate + Reject
        permeate_volume = feed_volume * self.recovery_ratio
        reject_volume = feed_volume * (1 - self.recovery_ratio)

        # Reuse calculation
        reuse_volume = reject_volume * (self.reuse_percentage / 100.0)

        # Update cumulative totals
        self.total_feed += feed_volume
        self.total_permeate += permeate_volume
        self.total_reject += reject_volume
        self.total_reuse += reuse_volume

        # Update reuse tank level
        self.reuse_tank_level += reuse_volume
        if self.reuse_tank_level > self.reuse_tank_capacity:
            # Tank overflow (in real system, this would trigger discharge)
            overflow = self.reuse_tank_level - self.reuse_tank_capacity
            self.reuse_tank_level = self.reuse_tank_capacity
            # In simulation, we just cap it

        return self.get_summary()

    def get_summary(self) -> RecoverySummary:
        """Get current recovery summary."""
        # Calculate actual recovery ratio from cumulative data
        if self.total_feed > 0:
            actual_recovery_ratio = self.total_permeate / self.total_feed
        else:
            actual_recovery_ratio = self.recovery_ratio

        # Calculate reuse percentage
        if self.total_reject > 0:
            actual_reuse_pct = (self.total_reuse / self.total_reject) * 100
        else:
            actual_reuse_pct = self.reuse_percentage

        return RecoverySummary(
            total_feed_litres=round(self.total_feed, 2),
            total_permeate_litres=round(self.total_permeate, 2),
            total_reject_litres=round(self.total_reject, 2),
            total_reuse_litres=round(self.total_reuse, 2),
            recovery_ratio=round(actual_recovery_ratio, 3),
            reuse_percentage=round(actual_reuse_pct, 1),
            reuse_tank_level=round(self.reuse_tank_level, 2),
            reuse_tank_capacity=self.reuse_tank_capacity,
            is_simulated=True
        )

    def reset(self):
        """Reset all cumulative statistics."""
        self.total_feed = 0.0
        self.total_permeate = 0.0
        self.total_reject = 0.0
        self.total_reuse = 0.0
        self.reuse_tank_level = 0.0

    def configure(
        self,
        recovery_ratio: float = None,
        reuse_percentage: float = None,
        tank_capacity: float = None
    ):
        """Update recovery configuration."""
        if recovery_ratio is not None:
            self.recovery_ratio = max(0.0, min(1.0, recovery_ratio))
        if reuse_percentage is not None:
            self.reuse_percentage = max(0.0, min(100.0, reuse_percentage))
        if tank_capacity is not None:
            self.reuse_tank_capacity = max(0.0, tank_capacity)

    def drain_reuse_tank(self, volume: float):
        """Simulate draining water from reuse tank (non-potable use)."""
        drained = min(volume, self.reuse_tank_level)
        self.reuse_tank_level -= drained
        return drained

    def get_environmental_impact(self) -> dict:
        """Calculate environmental impact metrics."""
        # Water saved from not being discharged directly
        water_saved_litres = self.total_reuse

        # Equivalent household water savings (average household uses ~150L/person/day)
        # Non-potable uses (toilet, garden) are ~50L/person/day
        days_of_nonpotable_water = water_saved_litres / 50.0 if self.total_reuse > 0 else 0

        return {
            'water_saved_litres': round(water_saved_litres, 2),
            'equivalent_nonpotable_days': round(days_of_nonpotable_water, 1),
            'discharge_reduction_pct': round(actual_reuse_pct, 1) if self.total_reject > 0 else 0,
            'is_simulated': True,
            'note': 'Environmental impact calculated from simulated recovery data'
        }
