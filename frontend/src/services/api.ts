import type {
  SystemHealth,
  SensorReading,
  SimulationStatus,
  WaterQualityAssessment,
  TreatmentStatus,
  VerificationResult,
  SafetyStatus,
  FilterHealth,
  FilterPrediction,
  Alert,
  RecoverySummary,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  readonly baseURL = API_BASE;

  async get<T = any>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    return response.json();
  }

  getHealth = () => this.request<SystemHealth>('/system/health');
  getStatus = () => this.request<Record<string, unknown>>('/system/status');

  getCurrentReadings = () => this.request<SensorReading[]>('/sensors/current');
  getSensorHistory = (params: { sensor_type?: string; start?: string; end?: string; limit?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    );
    return this.request<SensorReading[]>(`/sensors/history?${query}`);
  };

  startSimulation = (config: { scenario?: string; seed?: number; speed?: number }) =>
    this.request<SimulationStatus>('/simulation/start', { method: 'POST', body: JSON.stringify(config) });
  pauseSimulation = () =>
    this.request<SimulationStatus>('/simulation/pause', { method: 'POST' });
  resumeSimulation = () =>
    this.request<SimulationStatus>('/simulation/resume', { method: 'POST' });
  stopSimulation = () =>
    this.request<SimulationStatus>('/simulation/stop', { method: 'POST' });
  resetSimulation = () =>
    this.request<SimulationStatus>('/simulation/reset', { method: 'POST' });
  getSimulationStatus = () =>
    this.request<SimulationStatus>('/simulation/status');
  setSimulationSpeed = (multiplier: number) =>
    this.request<SimulationStatus>('/simulation/speed', { method: 'POST', body: JSON.stringify({ multiplier }) });
  injectFault = (sensor_type: string, fault_type: string) =>
    this.request<Record<string, unknown>>('/simulation/fault', { method: 'POST', body: JSON.stringify({ sensor_type, fault_type }) });
  adjustSensor = (sensor_type: string, value: number) =>
    this.request<Record<string, unknown>>('/simulation/adjust', { method: 'POST', body: JSON.stringify({ sensor_type, value }) });
  setScenario = (scenario: string) =>
    this.request<Record<string, unknown>>('/simulation/scenario', { method: 'POST', body: JSON.stringify({ scenario }) });
  clearFault = (sensor_type?: string) =>
    this.request<Record<string, unknown>>('/simulation/fault/clear', { method: 'POST', body: JSON.stringify({ sensor_type }) });

  getWaterQuality = () =>
    this.request<WaterQualityAssessment>('/water-quality/current');
  getWaterQualityHistory = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {});
    return this.request<WaterQualityAssessment[]>(`/water-quality/history?${query}`);
  };

  getTreatmentStatus = () =>
    this.request<TreatmentStatus>('/treatment/status');
  configureTreatment = (config: Record<string, unknown>) =>
    this.request<Record<string, unknown>>('/treatment/configure', { method: 'POST', body: JSON.stringify(config) });

  getVerification = () =>
    this.request<VerificationResult>('/verification/latest');
  getVerificationHistory = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {});
    return this.request<VerificationResult[]>(`/verification/history?${query}`);
  };

  getSafetyStatus = () =>
    this.request<SafetyStatus>('/safety/status');
  acknowledgeSafety = () =>
    this.request<SafetyStatus>('/safety/acknowledge', { method: 'POST' });

  getFilters = () =>
    this.request<FilterHealth[]>('/filters');
  getFilterPrediction = () =>
    this.request<FilterPrediction[]>('/filters/prediction');
  trainFilterModel = () =>
    this.request<Record<string, unknown>>('/filters/train', { method: 'POST' });
  getFilterHistory = (component: string) =>
    this.request<Record<string, unknown>[]>(`/filters/history/${component}`);
  recordMaintenance = (data: { component: string; action: string; notes: string }) =>
    this.request<Record<string, unknown>>('/filters/maintenance', { method: 'POST', body: JSON.stringify(data) });

  getRecoverySummary = () =>
    this.request<RecoverySummary>('/recovery/summary');
  configureRecovery = (config: Record<string, number>) =>
    this.request<Record<string, unknown>>('/recovery/configure', { method: 'POST', body: JSON.stringify(config) });
  getRecoveryHistory = () =>
    this.request<Record<string, unknown>[]>('/recovery/history');

  getAlerts = (params?: { severity?: string; acknowledged?: boolean; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.acknowledged !== undefined) query.set('acknowledged', String(params.acknowledged));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return this.request<Alert[]>(`/alerts?${query}`);
  };
  acknowledgeAlert = (id: number) =>
    this.request<Alert>(`/alerts/${id}/acknowledge`, { method: 'POST' });
  resolveAlert = (id: number) =>
    this.request<Alert>(`/alerts/${id}/resolve`, { method: 'POST' });
  getTimeline = () =>
    this.request<Record<string, unknown>[]>('/alerts/timeline');
  exportAlerts = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {});
    return this.request<string>(`/alerts/export?${query}`);
  };

  getAnalyticsSummary = () =>
    this.request<Record<string, unknown>>('/analytics/summary');
  getConsumptionStats = () =>
    this.request<Record<string, unknown>>('/analytics/consumption');
  exportAnalytics = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {});
    return this.request<Record<string, unknown>>(`/analytics/export?${query}`);
  };
  getFilterAnalytics = () =>
    this.request<Record<string, unknown>>('/analytics/filter-history');
  getFaultFrequency = () =>
    this.request<Record<string, unknown>>('/analytics/fault-frequency');

  getSettings = () =>
    this.request<Record<string, unknown>>('/system/settings');
  updateSettings = (settings: Record<string, unknown>) =>
    this.request<Record<string, unknown>>('/system/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

export const api = new ApiClient();
