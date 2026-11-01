"""Filter health and maintenance service."""
from typing import List, Optional
from datetime import datetime, timedelta
from ..domain.schemas import FilterHealth
from ..domain.enums import FilterComponent
from ..repositories.filter_repository import FilterRepository
from ..core.config import get_settings

class FilterService:
    """Service for filter health tracking and predictive maintenance."""

    def __init__(self, filter_repo: FilterRepository):
        self.filter_repo = filter_repo
        self.settings = get_settings()

        # Expected filter lifetimes (configurable)
        self.expected_lifetimes = {
            FilterComponent.SEDIMENT: {'litres': 6000, 'hours': 4380, 'months': 6},
            FilterComponent.CARBON: {'litres': 6000, 'hours': 4380, 'months': 6},
            FilterComponent.UF_MEMBRANE: {'litres': 8000, 'hours': 8760, 'months': 12},
            FilterComponent.RO_MEMBRANE: {'litres': 6000, 'hours': 17520, 'months': 24},
            FilterComponent.UV_LAMP: {'litres': 50000, 'hours': 8000, 'months': 12},
        }

    def get_all_filters(self) -> List[FilterHealth]:
        """Get health status of all filter components."""
        filters = self.filter_repo.get_all_filters()
        return [self._build_filter_health(f) for f in filters]

    def get_filter_detail(self, component: FilterComponent) -> Optional[FilterHealth]:
        """Get detailed information for a specific filter component."""
        filter_record = self.filter_repo.get_filter_by_component(component)
        if filter_record:
            return self._build_filter_health(filter_record)
        return None

    def update_filter_usage(
        self,
        component: FilterComponent,
        litres: float,
        hours: float,
        pressure_diff: Optional[float] = None,
        flow_rate: Optional[float] = None
    ):
        """Update filter usage statistics."""
        filter_record = self.filter_repo.get_filter_by_component(component)
        if not filter_record:
            return

        # Update cumulative usage
        filter_record.litres_processed += litres
        filter_record.operating_hours += hours

        # Update pressure differential (average or latest)
        if pressure_diff is not None:
            filter_record.pressure_differential = pressure_diff

        # Calculate flow degradation
        if flow_rate is not None and component != FilterComponent.UV_LAMP:
            expected_flow = 1.5  # L/min baseline
            filter_record.flow_degradation = max(0, (expected_flow - flow_rate) / expected_flow)

        # Update health
        health = self.calculate_health(filter_record)
        filter_record.health_pct = health

        # Update status
        if health < 20:
            filter_record.status = 'critical'
        elif health < 40:
            filter_record.status = 'replace_soon'
        elif health < 70:
            filter_record.status = 'degraded'
        else:
            filter_record.status = 'healthy'

        self.filter_repo.update_filter(filter_record)

        # Log health history
        self.filter_repo.save_health_history(filter_record.id, health, litres, hours, pressure_diff)

    def calculate_health(self, filter_record) -> float:
        """
        Calculate filter health percentage based on usage and operating conditions.

        Health is based on multiple factors:
        - Litres processed vs expected life
        - Operating hours vs expected life
        - Pressure differential trend (clogging indicator)
        - Flow degradation

        Returns a value from 0-100 where 100 is brand new, 0 is end-of-life.
        """
        component = FilterComponent(filter_record.component)
        expected = self.expected_lifetimes[component]

        # Factor 1: Litres-based degradation
        litres_used_pct = (filter_record.litres_processed / expected['litres']) * 100 if expected['litres'] > 0 else 0

        # Factor 2: Hours-based degradation
        hours_used_pct = (filter_record.operating_hours / expected['hours']) * 100 if expected['hours'] > 0 else 0

        # Use the worse of the two (more conservative)
        usage_degradation = max(litres_used_pct, hours_used_pct)

        # Factor 3: Performance degradation from pressure/flow
        performance_degradation = 0
        if filter_record.pressure_differential is not None:
            # Higher pressure differential indicates clogging
            normal_pressure = 0.3
            if component == FilterComponent.RO_MEMBRANE:
                normal_pressure = 1.0
            elif component == FilterComponent.UF_MEMBRANE:
                normal_pressure = 0.5

            if filter_record.pressure_differential > normal_pressure * 2:
                performance_degradation += 20
            elif filter_record.pressure_differential > normal_pressure * 1.5:
                performance_degradation += 10

        if filter_record.flow_degradation is not None and filter_record.flow_degradation > 0.3:
            performance_degradation += 15

        # Calculate final health (100% - total degradation)
        health = 100 - usage_degradation - performance_degradation

        # Clamp to valid range
        return max(0.0, min(100.0, health))

    def estimate_remaining_life(self, component: FilterComponent) -> dict:
        """Estimate remaining filter life based on current usage trend."""
        filter_record = self.filter_repo.get_filter_by_component(component)
        if not filter_record:
            return {'error': 'Filter not found'}

        expected = self.expected_lifetimes[component]

        # Calculate days since installation
        if isinstance(filter_record.installed_date, datetime):
            days_installed = (datetime.utcnow() - filter_record.installed_date).days
        else:
            days_installed = 1

        if days_installed < 1:
            days_installed = 1

        # Linear extrapolation based on usage rate
        litres_remaining = expected['litres'] - filter_record.litres_processed
        hours_remaining = expected['hours'] - filter_record.operating_hours

        # Estimate days remaining based on average daily usage
        litres_per_day = filter_record.litres_processed / days_installed if days_installed > 0 else 0
        hours_per_day = filter_record.operating_hours / days_installed if days_installed > 0 else 0

        if litres_per_day > 0:
            days_by_litres = litres_remaining / litres_per_day
        else:
            days_by_litres = 9999

        if hours_per_day > 0:
            days_by_hours = hours_remaining / hours_per_day
        else:
            days_by_hours = 9999

        # Use the more conservative estimate
        estimated_days = min(days_by_litres, days_by_hours)

        return {
            'estimated_days_remaining': max(0, int(estimated_days)),
            'estimated_litres_remaining': max(0, int(litres_remaining)),
            'estimated_hours_remaining': max(0, int(hours_remaining)),
            'usage_rate_litres_per_day': round(litres_per_day, 2),
            'usage_rate_hours_per_day': round(hours_per_day, 2),
        }

    def get_degradation_trend(self, component: FilterComponent, days: int = 30) -> List[dict]:
        """Get historical degradation trend for a filter."""
        filter_record = self.filter_repo.get_filter_by_component(component)
        if not filter_record:
            return []

        history = self.filter_repo.get_health_history(filter_record.id, limit=days * 24)  # Assuming hourly logs
        return [
            {
                'timestamp': h.timestamp.isoformat() if isinstance(h.timestamp, datetime) else h.timestamp,
                'health_pct': h.health_pct,
                'litres_processed': h.litres_processed,
                'operating_hours': h.operating_hours,
            }
            for h in history
        ]

    def record_maintenance(self, component: FilterComponent, action: str, notes: str = ""):
        """Record a maintenance action."""
        filter_record = self.filter_repo.get_filter_by_component(component)
        if not filter_record:
            return False

        self.filter_repo.save_maintenance(filter_record.id, action, notes)

        # If this was a replacement, reset the filter
        if action.lower() in ['replace', 'replacement', 'replaced']:
            filter_record.installed_date = datetime.utcnow()
            filter_record.litres_processed = 0
            filter_record.operating_hours = 0
            filter_record.pressure_differential = None
            filter_record.flow_degradation = None
            filter_record.health_pct = 100.0
            filter_record.status = 'healthy'
            self.filter_repo.update_filter(filter_record)

        return True

    def _build_filter_health(self, filter_record) -> FilterHealth:
        """Build FilterHealth schema from database record."""
        component = FilterComponent(filter_record.component)
        expected = self.expected_lifetimes[component]

        # Generate recommendation
        health = filter_record.health_pct
        if health < 20:
            recommendation = f"URGENT: Replace {component.value.replace('_', ' ')} immediately"
        elif health < 40:
            recommendation = f"Schedule replacement for {component.value.replace('_', ' ')} soon"
        elif health < 70:
            recommendation = f"Monitor {component.value.replace('_', ' ')} closely - showing degradation"
        else:
            recommendation = f"{component.value.replace('_', ' ').title()} is in good condition"

        # Estimate replacement date
        estimate = self.estimate_remaining_life(component)

        # Map string status to QualityLevel enum
        from ..domain.enums import QualityLevel
        status_map = {
            'healthy': QualityLevel.NORMAL,
            'degraded': QualityLevel.WARNING,
            'replace_soon': QualityLevel.WARNING,
            'critical': QualityLevel.CRITICAL,
            'normal': QualityLevel.NORMAL,
            'warning': QualityLevel.WARNING
        }
        status_enum = status_map.get(filter_record.status, QualityLevel.NORMAL)

        return FilterHealth(
            component=component,
            health_pct=health,
            installed_date=filter_record.installed_date if isinstance(filter_record.installed_date, datetime) else None,
            litres_processed=filter_record.litres_processed,
            operating_hours=filter_record.operating_hours,
            expected_life_hours=expected['hours'],
            pressure_differential=filter_record.pressure_differential,
            flow_degradation=filter_record.flow_degradation,
            cycles=int(filter_record.cycles) if hasattr(filter_record, 'cycles') and filter_record.cycles else 0,
            status=status_enum,
            estimated_remaining_hours=estimate.get('estimated_hours_remaining'),
            estimated_remaining_litres=estimate.get('estimated_litres_remaining'),
            recommendation=recommendation
        )
