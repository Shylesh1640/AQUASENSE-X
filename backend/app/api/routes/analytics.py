"""Analytics and reporting routes."""
from fastapi import APIRouter, Request, Query
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_analytics_summary(request: Request):
    """Get overall analytics summary."""
    sensor_service = request.app.state.services['sensor']
    filter_service = request.app.state.services['filter']
    recovery_service = request.app.state.services['recovery']
    alert_service = request.app.state.services['alert']

    # Gather summary statistics
    recovery = recovery_service.get_summary()
    filters = filter_service.get_all_filters()
    alerts_summary = alert_service.get_alert_summary()

    return {
        "total_litres_processed": recovery.total_feed_litres,
        "total_purified_litres": recovery.total_permeate_litres,
        "avg_filter_health": sum(f.health_pct for f in filters) / len(filters) if filters else 100,
        "active_alerts": alerts_summary.get('unacknowledged', 0),
        "recovery_ratio": recovery.recovery_ratio,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/consumption")
async def get_consumption_stats(request: Request):
    """Get water consumption statistics."""
    recovery_service = request.app.state.services['recovery']
    recovery = recovery_service.get_summary()

    return {
        "total_feed": recovery.total_feed_litres,
        "total_purified": recovery.total_permeate_litres,
        "total_reject": recovery.total_reject_litres,
        "total_reused": recovery.total_reuse_litres,
        "efficiency_pct": (recovery.total_permeate_litres / recovery.total_feed_litres * 100) if recovery.total_feed_litres > 0 else 0
    }

@router.get("/export")
async def export_analytics(
    request: Request,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None)
):
    """Export analytics data as CSV."""
    sensor_service = request.app.state.services['sensor']

    start_dt = datetime.fromisoformat(start) if start else datetime.utcnow() - timedelta(days=7)
    end_dt = datetime.fromisoformat(end) if end else datetime.utcnow()

    # Get sensor history
    readings = sensor_service.get_sensor_history(
        sensor_type=None,
        start=start_dt,
        end=end_dt,
        limit=10000
    )

    # Generate CSV
    csv_lines = ["Timestamp,Sensor,Value,Unit,Valid,Simulated"]
    for r in readings:
        csv_lines.append(
            f"{r.timestamp},{r.sensor_type.value},{r.value},{r.unit},{r.is_valid},{r.is_simulated}"
        )

    return {"csv": "\n".join(csv_lines), "count": len(readings)}

@router.get("/filter-history")
async def get_filter_analytics(request: Request):
    """Get filter degradation analytics."""
    filter_service = request.app.state.services['filter']
    filters = filter_service.get_all_filters()

    return {
        "filters": [
            {
                "component": f.component.value,
                "health_pct": f.health_pct,
                "litres_processed": f.litres_processed,
                "operating_hours": f.operating_hours,
                "status": f.status
            }
            for f in filters
        ]
    }

@router.get("/fault-frequency")
async def get_fault_frequency(request: Request):
    """Get fault frequency statistics."""
    alert_service = request.app.state.services['alert']

    from ...domain.enums import AlertCategory
    categories = [c for c in AlertCategory]

    frequency = {}
    for category in categories:
        alerts = alert_service.get_alerts(category=category, limit=1000)
        frequency[category.value] = len(alerts)

    return {"fault_frequency": frequency}
