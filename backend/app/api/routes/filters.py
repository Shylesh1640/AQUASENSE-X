"""Filter health and predictive maintenance routes."""
from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/filters", tags=["Filters"])

@router.get("")
async def get_all_filters(request: Request):
    """Get health status of all filter components."""
    filter_service = request.app.state.services['filter']
    filters = filter_service.get_all_filters()
    return [f.dict() for f in filters]

@router.get("/{component}")
async def get_filter_detail(component: str, request: Request):
    """Get detailed information for a specific filter."""
    filter_service = request.app.state.services['filter']

    from ...domain.enums import FilterComponent
    try:
        component_enum = FilterComponent(component)
        filter_health = filter_service.get_filter_detail(component_enum)
        if filter_health:
            return filter_health.dict()
        else:
            raise HTTPException(404, "Filter not found")
    except ValueError:
        raise HTTPException(400, f"Invalid component: {component}")

@router.get("/prediction")
async def get_filter_prediction(request: Request):
    """Get ML-based filter life predictions for all components."""
    from ...ml.inference import PredictionService
    from ...domain.enums import FilterComponent

    filter_service = request.app.state.services['filter']
    prediction_service = PredictionService()

    # Prepare data for all filters
    filters_data = {}
    for component in FilterComponent:
        filter_health = filter_service.get_filter_detail(component)
        if filter_health:
            filters_data[component.value] = {
                'cumulative_litres': filter_health.litres_processed,
                'operating_hours': filter_health.operating_hours,
                'avg_inlet_tds': 350,  # Would come from historical data
                'avg_inlet_turbidity': 2.0,
                'pressure_differential': filter_health.pressure_differential or 0.3,
                'flow_rate_ratio': 1.0 - (filter_health.flow_degradation or 0),
                'treatment_cycles': int(filter_health.operating_hours * 2),  # Estimate
                'days_since_install': 30,  # Would calculate from installed_date
            }

    predictions = prediction_service.predict_all(filters_data)

    return [
        {
            'component': component,
            **prediction
        }
        for component, prediction in predictions.items()
    ]

@router.post("/train")
async def train_filter_model(request: Request):
    """Train filter health prediction models."""
    from ...ml.training import ModelTrainer

    trainer = ModelTrainer()
    results = trainer.train_all(n_samples=1000)

    # Reload models in prediction service
    from ...ml.inference import PredictionService
    prediction_service = PredictionService()
    prediction_service.reload_models()

    return {
        "trained": True,
        "models": list(results.keys()),
        "synthetic_data": True,
        "note": "Models trained on synthetic data. Real-world performance may differ."
    }

@router.get("/history/{component}")
async def get_filter_history(component: str, request: Request):
    """Get degradation history for a filter component."""
    filter_service = request.app.state.services['filter']

    from ...domain.enums import FilterComponent
    try:
        component_enum = FilterComponent(component)
        history = filter_service.get_degradation_trend(component_enum, days=30)
        return history
    except ValueError:
        raise HTTPException(400, f"Invalid component: {component}")

@router.post("/maintenance")
async def record_maintenance(maintenance: dict, request: Request):
    """Record a maintenance action."""
    filter_service = request.app.state.services['filter']

    from ...domain.enums import FilterComponent
    component_enum = FilterComponent(maintenance['component'])
    action = maintenance['action']
    notes = maintenance.get('notes', '')

    success = filter_service.record_maintenance(component_enum, action, notes)

    return {"recorded": success}
