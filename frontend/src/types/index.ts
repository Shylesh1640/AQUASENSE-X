export enum SensorType {
  TDS = 'tds',
  PH = 'ph',
  TURBIDITY = 'turbidity',
  TEMPERATURE = 'temperature',
  FLOW = 'flow',
  PRESSURE = 'pressure',
}

export enum SimulationState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
}

export enum QualityLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum TreatmentStage {
  SEDIMENT = 'sediment',
  CARBON = 'carbon',
  UF = 'uf',
  RO = 'ro',
  UV = 'uv',
  SELECTIVE_MEDIA = 'selective_media',
  REMINERALIZATION = 'remineralization',
}

export enum StageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  WARNING = 'warning',
  FAILED = 'failed',
  BYPASSED = 'bypassed',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  WARNING = 'warning',
  FAILED = 'failed',
  UNABLE_TO_VERIFY = 'unable_to_verify',
}

export enum DispensingStatus {
  ALLOWED = 'allowed',
  LOCKED = 'locked',
}

export enum FilterComponent {
  SEDIMENT = 'sediment',
  CARBON = 'carbon',
  UF_MEMBRANE = 'uf_membrane',
  RO_MEMBRANE = 'ro_membrane',
  UV_LAMP = 'uv_lamp',
}

export interface SensorReading {
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  is_valid: boolean;
  is_simulated: boolean;
  quality_level?: QualityLevel;
}

export interface SimulationStatus {
  state: SimulationState;
  scenario: string;
  speed: number;
  tick_count: number;
  elapsed_seconds: number;
  session_id?: string;
  active_faults: string[];
}

export interface ParameterAssessment {
  sensor_type: SensorType;
  value: number;
  unit: string;
  level: QualityLevel;
  message: string;
  explanation: string;
  threshold_low?: number;
  threshold_high?: number;
}

export interface WaterQualityAssessment {
  overall_level: QualityLevel;
  overall_message: string;
  parameters: ParameterAssessment[];
  timestamp: string;
  is_simulated: boolean;
}

export interface TreatmentStageStatus {
  stage: TreatmentStage;
  status: StageStatus;
  input_tds?: number;
  output_tds?: number;
  input_turbidity?: number;
  output_turbidity?: number;
  flow_rate?: number;
  pressure?: number;
  health_pct?: number;
}

export interface TreatmentStatus {
  stages: TreatmentStageStatus[];
  active_path: TreatmentStage[];
  decision_reason: string;
  timestamp: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  outlet_tds: number;
  outlet_ph: number;
  outlet_turbidity: number;
  outlet_temperature: number;
  inlet_tds: number;
  tds_reduction_pct: number;
  details: string;
  timestamp: string;
}

export interface SafetyStatus {
  dispensing: DispensingStatus;
  lock_reasons: string[];
  required_actions: string[];
  last_updated: string;
  requires_acknowledgement: boolean;
}

export interface FilterHealth {
  component: FilterComponent;
  health_pct: number;
  installed_date: string;
  litres_processed: number;
  operating_hours: number;
  expected_life_litres: number;
  expected_life_hours: number;
  pressure_differential?: number;
  flow_degradation?: number;
  status: string;
  predicted_replacement?: string;
  recommendation: string;
}

export interface FilterPrediction {
  component: FilterComponent;
  predicted_remaining_days: number;
  predicted_remaining_litres: number;
  confidence: string;
  model_version: string;
  is_synthetic_model: boolean;
}

export interface Alert {
  id: number;
  timestamp: string;
  severity: AlertSeverity;
  category: string;
  source: string;
  description: string;
  recommended_action: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
}

export interface RecoverySummary {
  total_feed_litres: number;
  total_permeate_litres: number;
  total_reject_litres: number;
  total_reuse_litres: number;
  recovery_ratio: number;
  reuse_percentage: number;
  reuse_tank_level: number;
  reuse_tank_capacity: number;
  is_simulated: boolean;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  version: string;
  uptime_seconds: number;
  database: string;
  simulation: SimulationState;
}

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export const SENSOR_CONFIG: Record<SensorType, { label: string; unit: string; min: number; max: number; color: string; icon: string }> = {
  [SensorType.TDS]: { label: 'TDS', unit: 'ppm', min: 0, max: 1500, color: '#1677C8', icon: 'Droplets' },
  [SensorType.PH]: { label: 'pH', unit: '', min: 0, max: 14, color: '#8B5CF6', icon: 'FlaskConical' },
  [SensorType.TURBIDITY]: { label: 'Turbidity', unit: 'NTU', min: 0, max: 50, color: '#E5A000', icon: 'Eye' },
  [SensorType.TEMPERATURE]: { label: 'Temperature', unit: '°C', min: 0, max: 50, color: '#D94848', icon: 'Thermometer' },
  [SensorType.FLOW]: { label: 'Flow Rate', unit: 'L/min', min: 0, max: 5, color: '#27B8D5', icon: 'Waves' },
  [SensorType.PRESSURE]: { label: 'Pressure', unit: 'bar', min: 0, max: 8, color: '#16A36A', icon: 'Gauge' },
};

export const QUALITY_COLORS: Record<QualityLevel, string> = {
  [QualityLevel.NORMAL]: '#16A36A',
  [QualityLevel.WARNING]: '#E5A000',
  [QualityLevel.CRITICAL]: '#D94848',
};

export const STAGE_LABELS: Record<TreatmentStage, string> = {
  [TreatmentStage.SEDIMENT]: 'Sediment Filter',
  [TreatmentStage.CARBON]: 'Activated Carbon',
  [TreatmentStage.UF]: 'UF Membrane',
  [TreatmentStage.RO]: 'RO Membrane',
  [TreatmentStage.UV]: 'UV Treatment',
  [TreatmentStage.SELECTIVE_MEDIA]: 'Selective Media',
  [TreatmentStage.REMINERALIZATION]: 'Remineralization',
};

export const FILTER_LABELS: Record<FilterComponent, string> = {
  [FilterComponent.SEDIMENT]: 'Sediment Filter',
  [FilterComponent.CARBON]: 'Carbon Filter',
  [FilterComponent.UF_MEMBRANE]: 'UF Membrane',
  [FilterComponent.RO_MEMBRANE]: 'RO Membrane',
  [FilterComponent.UV_LAMP]: 'UV Lamp',
};
