"""Treatment process service."""
from typing import List, Dict, Optional
from datetime import datetime
from ..domain.schemas import TreatmentStatus, StageStatusDetail
from ..domain.enums import TreatmentStage, StageStatus, QualityLevel
from ..core.config import get_settings

class TreatmentService:
    """Service for treatment process management."""

    # Treatment stage coefficients (configurable)
    STAGE_EFFECTS = {
        TreatmentStage.SEDIMENT: {
            'turbidity_reduction': 0.50,
            'tds_reduction': 0.02,
            'pressure_drop': 0.2,
        },
        TreatmentStage.CARBON: {
            'turbidity_reduction': 0.20,
            'tds_reduction': 0.01,
            'ph_adjustment': 0.05,
            'pressure_drop': 0.15,
        },
        TreatmentStage.UF: {
            'turbidity_reduction': 0.90,
            'tds_reduction': 0.075,
            'pressure_drop': 0.4,
        },
        TreatmentStage.RO: {
            'tds_reduction': 0.90,
            'turbidity_reduction': 0.95,
            'ph_adjustment': -0.2,
            'pressure_drop': 1.2,
        },
        TreatmentStage.UV: {
            # UV doesn't affect physical parameters
            'pressure_drop': 0.0,
        },
        TreatmentStage.SELECTIVE_MEDIA: {
            'tds_reduction': 0.05,
            'specific_contaminant_reduction': 0.70,
            'pressure_drop': 0.25,
        },
        TreatmentStage.REMINERALIZATION: {
            'tds_addition': 30,  # ppm added back
            'ph_adjustment': 0.3,
            'pressure_drop': 0.1,
        },
    }

    def __init__(self, config=None):
        self.settings = config or get_settings()
        self.stage_health = {stage: 100.0 for stage in TreatmentStage}
        self.stage_status = {stage: StageStatus.ACTIVE for stage in TreatmentStage}
        # Selective media is optional
        self.stage_status[TreatmentStage.SELECTIVE_MEDIA] = StageStatus.INACTIVE

    def get_treatment_status(self, inlet_readings: dict, simulation_engine=None) -> TreatmentStatus:
        """Get current treatment status."""
        if simulation_engine:
            state = simulation_engine.get_current_state()
            return TreatmentStatus(
                stages=[
                    StageStatusDetail(
                        stage=TreatmentStage(s['stage']),
                        status=StageStatus(s['status']),
                        input_tds=s.get('input_tds'),
                        output_tds=s.get('output_tds'),
                        input_turbidity=s.get('input_turbidity'),
                        output_turbidity=s.get('output_turbidity'),
                        flow_rate=s.get('flow_rate'),
                        pressure=s.get('pressure'),
                        health_pct=s.get('health_pct')
                    )
                    for s in state.get('treatment_stages', [])
                ],
                active_path=[TreatmentStage(s) for s in state.get('active_treatment_path', [])],
                decision_reason=state.get('treatment_decision_reason', ''),
                timestamp=datetime.utcnow().isoformat()
            )
        else:
            # Generate from current state
            active_path = self.calculate_treatment_path(inlet_readings)
            stages_status = []
            for stage in TreatmentStage:
                stages_status.append(StageStatusDetail(
                    stage=stage,
                    status=self.stage_status[stage],
                    health_pct=self.stage_health[stage]
                ))
            return TreatmentStatus(
                stages=stages_status,
                active_path=active_path,
                decision_reason="Standard treatment path based on inlet conditions",
                timestamp=datetime.utcnow().isoformat()
            )

    def calculate_treatment_path(self, inlet_quality: dict) -> List[TreatmentStage]:
        """Calculate optimal treatment path based on inlet conditions."""
        path = []

        tds = inlet_quality.get('tds', 0)
        turbidity = inlet_quality.get('turbidity', 0)
        ph = inlet_quality.get('ph', 7.0)

        # Always use sediment and carbon pre-treatment
        path.extend([TreatmentStage.SEDIMENT, TreatmentStage.CARBON])

        # UF for turbidity
        if turbidity > 1.0:
            path.append(TreatmentStage.UF)

        # RO for TDS
        if tds > 100:
            path.append(TreatmentStage.RO)

        # UV for sterilization (always)
        path.append(TreatmentStage.UV)

        # Selective media if needed (optional for specific contaminants)
        # Currently inactive unless specifically enabled

        # Remineralization if RO was used (adds minerals back)
        if TreatmentStage.RO in path:
            path.append(TreatmentStage.REMINERALIZATION)

        return path

    def simulate_stage_output(self, stage: TreatmentStage, inlet_params: dict, stage_health: float) -> dict:
        """Simulate output parameters after a treatment stage."""
        outlet_params = inlet_params.copy()
        effects = self.STAGE_EFFECTS.get(stage, {})

        # Health factor (0-100% converts to 0.0-1.0 multiplier)
        health_factor = stage_health / 100.0

        # Apply reductions
        if 'turbidity_reduction' in effects and 'turbidity' in inlet_params:
            reduction = effects['turbidity_reduction'] * health_factor
            outlet_params['turbidity'] = inlet_params['turbidity'] * (1 - reduction)

        if 'tds_reduction' in effects and 'tds' in inlet_params:
            reduction = effects['tds_reduction'] * health_factor
            outlet_params['tds'] = inlet_params['tds'] * (1 - reduction)

        if 'tds_addition' in effects and 'tds' in inlet_params:
            # Remineralization adds TDS back
            outlet_params['tds'] = inlet_params['tds'] + effects['tds_addition']

        if 'ph_adjustment' in effects and 'ph' in inlet_params:
            adjustment = effects['ph_adjustment'] * health_factor
            outlet_params['ph'] = inlet_params['ph'] + adjustment
            outlet_params['ph'] = max(0, min(14, outlet_params['ph']))  # Clamp to valid range

        # Pressure drop (accumulates through stages)
        if 'pressure' in inlet_params and 'pressure_drop' in effects:
            outlet_params['pressure'] = max(0, inlet_params['pressure'] - effects['pressure_drop'])

        return outlet_params

    def simulate_full_treatment(self, inlet_readings: dict) -> dict:
        """Simulate water passing through all active treatment stages."""
        current_params = {
            'tds': inlet_readings.get('tds', 300),
            'turbidity': inlet_readings.get('turbidity', 1.0),
            'ph': inlet_readings.get('ph', 7.0),
            'temperature': inlet_readings.get('temperature', 25.0),
            'pressure': inlet_readings.get('pressure', 2.5),
            'flow': inlet_readings.get('flow', 1.5),
        }

        treatment_path = self.calculate_treatment_path(current_params)

        # Run through each stage
        for stage in treatment_path:
            if self.stage_status[stage] in [StageStatus.ACTIVE, StageStatus.WARNING]:
                health = self.stage_health[stage]
                current_params = self.simulate_stage_output(stage, current_params, health)

        return current_params

    def configure_stage(self, stage: TreatmentStage, config: dict) -> bool:
        """Configure treatment stage parameters."""
        if 'status' in config:
            self.stage_status[stage] = StageStatus(config['status'])
        if 'health' in config:
            self.stage_health[stage] = max(0, min(100, config['health']))
        return True

    def get_stage_details(self, stage: TreatmentStage) -> dict:
        """Get detailed information about a specific stage."""
        return {
            'stage': stage.value,
            'status': self.stage_status[stage].value,
            'health_pct': self.stage_health[stage],
            'effects': self.STAGE_EFFECTS.get(stage, {}),
            'description': self._get_stage_description(stage),
        }

    def _get_stage_description(self, stage: TreatmentStage) -> str:
        """Get human-readable description of a treatment stage."""
        descriptions = {
            TreatmentStage.SEDIMENT: "Removes large particles, sediment, and suspended solids. First line of defense.",
            TreatmentStage.CARBON: "Activated carbon removes chlorine, organic compounds, and improves taste and odor.",
            TreatmentStage.UF: "Ultrafiltration membrane removes bacteria, viruses, and fine particles down to 0.01 microns.",
            TreatmentStage.RO: "Reverse osmosis removes dissolved solids, heavy metals, and most contaminants. Most effective stage.",
            TreatmentStage.UV: "UV light sterilizes water by destroying bacteria, viruses, and other microorganisms.",
            TreatmentStage.SELECTIVE_MEDIA: "Optional stage for targeting specific contaminants like fluoride or arsenic.",
            TreatmentStage.REMINERALIZATION: "Adds beneficial minerals back to water after RO treatment for taste and health.",
        }
        return descriptions.get(stage, "")

    def set_stage_fault(self, stage: TreatmentStage, fault: bool = True):
        """Set or clear a stage fault."""
        if fault:
            self.stage_status[stage] = StageStatus.FAILED
        else:
            self.stage_status[stage] = StageStatus.ACTIVE

    def update_stage_health(self, stage: TreatmentStage, health_pct: float):
        """Update stage health percentage."""
        self.stage_health[stage] = max(0, min(100, health_pct))

        # Update status based on health
        if health_pct < 20:
            self.stage_status[stage] = StageStatus.FAILED
        elif health_pct < 50:
            self.stage_status[stage] = StageStatus.WARNING
        else:
            self.stage_status[stage] = StageStatus.ACTIVE
