"""Alert and event management routes."""
from fastapi import APIRouter, Request, Query
from typing import Optional

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
async def get_alerts(
    request: Request,
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get alerts with optional filtering."""
    alert_service = request.app.state.services['alert']

    from ...domain.enums import AlertSeverity
    severity_enum = AlertSeverity(severity) if severity else None

    alerts = alert_service.get_alerts(
        severity=severity_enum,
        acknowledged=acknowledged,
        limit=limit,
        offset=offset
    )

    return [a.dict() for a in alerts]

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, request: Request):
    """Acknowledge an alert."""
    alert_service = request.app.state.services['alert']
    success = alert_service.acknowledge_alert(alert_id)
    return {"acknowledged": success, "alert_id": alert_id}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, request: Request):
    """Resolve an alert."""
    alert_service = request.app.state.services['alert']
    success = alert_service.resolve_alert(alert_id)
    return {"resolved": success, "alert_id": alert_id}

@router.get("/timeline")
async def get_event_timeline(
    request: Request,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get system event timeline."""
    alert_service = request.app.state.services['alert']
    events = alert_service.get_event_timeline(limit=limit)
    return events

@router.get("/export")
async def export_alerts(request: Request):
    """Export alerts as CSV."""
    alert_service = request.app.state.services['alert']
    alerts = alert_service.get_alerts(limit=10000)

    # Simple CSV generation
    csv_lines = ["ID,Timestamp,Severity,Category,Source,Description,Acknowledged,Resolved"]
    for alert in alerts:
        csv_lines.append(
            f"{alert.id},{alert.timestamp},{alert.severity.value},{alert.category.value},"
            f"{alert.source},{alert.description},{alert.acknowledged},{alert.resolved}"
        )

    return {"csv": "\n".join(csv_lines), "count": len(alerts)}

@router.get("/summary")
async def get_alert_summary(request: Request):
    """Get alert summary statistics."""
    alert_service = request.app.state.services['alert']
    summary = alert_service.get_alert_summary()
    return summary
