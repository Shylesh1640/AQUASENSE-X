import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Waves,
  Filter,
  Shield,
  Recycle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { api } from '../services/api';

const STAGE_ORDER = [
  { key: 'sediment', label: 'Sediment' },
  { key: 'carbon', label: 'Carbon' },
  { key: 'uf', label: 'UF' },
  { key: 'ro', label: 'RO' },
  { key: 'uv', label: 'UV' },
  { key: 'remineralization', label: 'Remin.' },
];

const stageColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-[#16A36A] text-white';
    case 'inactive':
      return 'bg-gray-300 text-gray-600';
    case 'warning':
      return 'bg-[#E5A000] text-white';
    case 'failed':
      return 'bg-[#D94848] text-white';
    case 'bypassed':
      return 'bg-gray-400 text-white';
    default:
      return 'bg-gray-200 text-gray-500';
  }
};

const severityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'emergency':
      return 'bg-red-100 text-[#D94848] border-red-200';
    case 'warning':
      return 'bg-yellow-50 text-[#E5A000] border-yellow-200';
    case 'info':
      return 'bg-blue-50 text-[#1677C8] border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

function qualityLevel(sensorType: string, value: number): 'normal' | 'warning' | 'critical' {
  switch (sensorType) {
    case 'tds':
      return value < 300 ? 'normal' : value < 600 ? 'warning' : 'critical';
    case 'ph':
      return value >= 6.5 && value <= 8.5 ? 'normal' : (value >= 5.5 && value < 6.5) || (value > 8.5 && value <= 9.5) ? 'warning' : 'critical';
    case 'turbidity':
      return value < 1 ? 'normal' : value < 5 ? 'warning' : 'critical';
    case 'temperature':
      return value >= 10 && value <= 35 ? 'normal' : (value >= 5 && value < 10) || (value > 35 && value <= 45) ? 'warning' : 'critical';
    case 'flow':
      return value >= 0.5 && value <= 3.0 ? 'normal' : (value >= 0.2 && value < 0.5) || (value > 3.0 && value <= 5.0) ? 'warning' : 'critical';
    case 'pressure':
      return value >= 1.0 && value <= 4.0 ? 'normal' : (value >= 0.5 && value < 1.0) || (value > 4.0 && value <= 6.0) ? 'warning' : 'critical';
    default:
      return 'normal';
  }
}

function statusBadge(level: 'normal' | 'warning' | 'critical') {
  const map = {
    normal: 'bg-[#16A36A]/10 text-[#16A36A]',
    warning: 'bg-[#E5A000]/10 text-[#E5A000]',
    critical: 'bg-[#D94848]/10 text-[#D94848]',
  };
  return map[level];
}

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'warning' | 'critical' | 'info';
  icon: React.ReactNode;
  change?: number;
  changeUnit?: string;
  timestamp?: string;
}

function KPICard({ label, value, unit, status, icon, change, changeUnit, timestamp }: KPICardProps) {
  const borderColor = {
    normal: 'border-l-[#16A36A]',
    warning: 'border-l-[#E5A000]',
    critical: 'border-l-[#D94848]',
    info: 'border-l-[#1677C8]',
  }[status];

  return (
    <div className={`bg-white rounded-lg border border-[#E2E8F0] border-l-4 ${borderColor} p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#718096] uppercase tracking-wider truncate">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#172B43]">{value}</span>
            {unit && <span className="text-sm text-[#718096]">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {change > 0 ? (
                <ArrowUp className="w-3 h-3 text-[#D94848]" />
              ) : change < 0 ? (
                <ArrowDown className="w-3 h-3 text-[#16A36A]" />
              ) : (
                <Minus className="w-3 h-3 text-[#718096]" />
              )}
              <span className="text-xs text-[#718096]">
                {Math.abs(change).toFixed(1)}{changeUnit ? ` ${changeUnit}` : ''}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${status === 'normal' ? 'bg-[#16A36A]/10 text-[#16A36A]' : status === 'warning' ? 'bg-[#E5A000]/10 text-[#E5A000]' : status === 'critical' ? 'bg-[#D94848]/10 text-[#D94848]' : 'bg-[#1677C8]/10 text-[#1677C8]'}`}>
          {icon}
        </div>
      </div>
      {timestamp && (
        <p className="text-[10px] text-[#718096] mt-2">{timestamp}</p>
      )}
    </div>
  );
}

export default function Overview() {
  const { data: readings } = useQuery({
    queryKey: ['sensors', 'current'],
    queryFn: () => api.getCurrentReadings(),
    refetchInterval: 2000,
  });

  const { data: simStatus } = useQuery({
    queryKey: ['simulation', 'status'],
    queryFn: () => api.getSimulationStatus(),
    refetchInterval: 2000,
  });

  const { data: treatmentStatus } = useQuery({
    queryKey: ['treatment', 'status'],
    queryFn: () => api.getTreatmentStatus(),
    refetchInterval: 2000,
  });

  const { data: filters } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.getFilters(),
    refetchInterval: 5000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: () => api.getAlerts({ limit: 5 }),
    refetchInterval: 3000,
  });

  const { data: recovery } = useQuery({
    queryKey: ['recovery', 'summary'],
    queryFn: () => api.getRecoverySummary(),
    refetchInterval: 5000,
  });

  const { data: safety } = useQuery({
    queryKey: ['safety', 'status'],
    queryFn: () => api.getSafetyStatus(),
    refetchInterval: 2000,
  });

  const { data: sensorHistory } = useQuery({
    queryKey: ['sensors', 'history', 'overview'],
    queryFn: () => api.getSensorHistory({ limit: 50 }),
    refetchInterval: 3000,
  });

  const sensorMap: Record<string, { value: number; unit: string; is_valid: boolean; timestamp: string; previous_value?: number }> = {};
  if (readings?.readings) {
    for (const r of readings.readings) {
      sensorMap[r.sensor_type] = r;
    }
  }

  const outletMap: Record<string, { value: number; unit: string }> = {};
  if (readings && readings.length > 0) {
    for (const r of readings) {
      outletMap[r.sensor_type] = r;
    }
  }

  const inletTds = sensorMap['tds']?.value ?? 0;
  const outletTds = outletMap['tds']?.value ?? sensorMap['tds_outlet']?.value ?? 0;
  const inletPh = sensorMap['ph']?.value ?? 7.0;
  const outletPh = outletMap['ph']?.value ?? sensorMap['ph_outlet']?.value ?? 7.0;
  const turbidity = sensorMap['turbidity']?.value ?? 0;
  const totalLitres = simStatus?.total_litres_processed ?? recovery?.total_feed ?? 0;

  const avgFilterHealth = filters?.filters
    ? (filters.filters.reduce((s: number, f: { health_pct: number }) => s + f.health_pct, 0) / filters.filters.length)
    : 100;

  const systemState = simStatus?.state ?? 'stopped';
  const isSimRunning = systemState === 'running';

  const inletOutletData = [
    { name: 'TDS', inlet: inletTds, outlet: outletTds },
    { name: 'pH', inlet: inletPh, outlet: outletPh },
    { name: 'Turbidity', inlet: turbidity, outlet: outletMap['turbidity']?.value ?? 0 },
  ];

  const trendData = sensorHistory?.readings
    ? sensorHistory.readings.slice(-50).map((r: { timestamp: string; tds?: number; ph?: number; turbidity?: number; temperature?: number; flow?: number; pressure?: number }, i: number) => ({
        idx: i,
        time: r.timestamp ? format(new Date(r.timestamp), 'HH:mm:ss') : `${i}`,
        tds: r.tds,
        ph: r.ph,
        turbidity: r.turbidity,
      }))
    : [];

  const stages = treatmentStatus?.stages ?? {};

  return (
    <div className="space-y-6">
      {/* Simulated data banner */}
      {isSimRunning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1677C8]/10 border border-[#1677C8]/30 rounded-lg text-[#1677C8] text-sm font-medium">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>SIMULATED DATA — Sensor readings are generated by the simulation engine</span>
          <span className="ml-auto text-xs bg-[#1677C8]/20 px-2 py-0.5 rounded">
            Speed: {simStatus?.speed ?? 1}x | Tick: {simStatus?.tick_count ?? 0}
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Inlet TDS"
          value={inletTds.toFixed(0)}
          unit="ppm"
          status={qualityLevel('tds', inletTds)}
          icon={<Droplets className="w-5 h-5" />}
          change={sensorMap['tds']?.previous_value != null ? inletTds - sensorMap['tds'].previous_value : undefined}
          changeUnit="ppm"
          timestamp={sensorMap['tds']?.timestamp ? format(new Date(sensorMap['tds'].timestamp), 'HH:mm:ss') : undefined}
        />
        <KPICard
          label="Outlet TDS"
          value={outletTds.toFixed(0)}
          unit="ppm"
          status={outletTds < 50 ? 'normal' : outletTds < 100 ? 'warning' : 'critical'}
          icon={<Droplets className="w-5 h-5" />}
          change={undefined}
          timestamp={sensorMap['tds']?.timestamp ? format(new Date(sensorMap['tds'].timestamp), 'HH:mm:ss') : undefined}
        />
        <KPICard
          label="Inlet pH"
          value={inletPh.toFixed(1)}
          unit=""
          status={qualityLevel('ph', inletPh)}
          icon={<Gauge className="w-5 h-5" />}
          change={sensorMap['ph']?.previous_value != null ? inletPh - sensorMap['ph'].previous_value : undefined}
        />
        <KPICard
          label="Outlet pH"
          value={outletPh.toFixed(1)}
          unit=""
          status={qualityLevel('ph', outletPh)}
          icon={<Gauge className="w-5 h-5" />}
        />
        <KPICard
          label="Turbidity"
          value={turbidity.toFixed(2)}
          unit="NTU"
          status={qualityLevel('turbidity', turbidity)}
          icon={<Waves className="w-5 h-5" />}
          change={sensorMap['turbidity']?.previous_value != null ? turbidity - sensorMap['turbidity'].previous_value : undefined}
          changeUnit="NTU"
        />
        <KPICard
          label="Total Processed"
          value={totalLitres.toFixed(1)}
          unit="L"
          status="info"
          icon={<Recycle className="w-5 h-5" />}
        />
        <KPICard
          label="System Status"
          value={systemState.charAt(0).toUpperCase() + systemState.slice(1)}
          status={systemState === 'running' ? 'normal' : systemState === 'paused' ? 'warning' : 'info'}
          icon={<Zap className="w-5 h-5" />}
        />
        <KPICard
          label="Filter Health"
          value={avgFilterHealth.toFixed(0)}
          unit="%"
          status={avgFilterHealth > 70 ? 'normal' : avgFilterHealth > 40 ? 'warning' : 'critical'}
          icon={<Filter className="w-5 h-5" />}
        />
      </div>

      {/* Trend and Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Trend */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">Live Sensor Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#718096" />
                <YAxis tick={{ fontSize: 10 }} stroke="#718096" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="tds" stroke="#1677C8" name="TDS" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ph" stroke="#16A36A" name="pH" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="turbidity" stroke="#E5A000" name="Turbidity" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#718096] text-sm">
              Start a simulation to see live trends
            </div>
          )}
        </div>

        {/* Inlet vs Outlet */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">Inlet vs Outlet Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={inletOutletData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#718096" />
              <YAxis tick={{ fontSize: 10 }} stroke="#718096" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inlet" fill="#1677C8" name="Inlet" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outlet" fill="#27B8D5" name="Outlet" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treatment Pipeline + Filter Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Pipeline */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">Treatment Pipeline</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {/* Inlet */}
            <div className="flex-shrink-0 px-3 py-2 bg-[#1677C8] text-white rounded-lg text-xs font-semibold">
              INLET
            </div>
            <ChevronRight className="w-4 h-4 text-[#718096] flex-shrink-0" />

            {STAGE_ORDER.map((stage, idx) => {
              const stStatus = stages[stage.key]?.status ?? 'inactive';
              return (
                <div key={stage.key} className="flex items-center gap-1">
                  <div
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold ${stageColor(stStatus)}`}
                    title={`${stage.label}: ${stStatus}`}
                  >
                    {stage.label}
                  </div>
                  {idx < STAGE_ORDER.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  )}
                </div>
              );
            })}

            <ChevronRight className="w-4 h-4 text-[#718096] flex-shrink-0" />
            <div className="flex-shrink-0 px-3 py-2 bg-[#27B8D5] text-white rounded-lg text-xs font-semibold">
              OUTLET
            </div>
          </div>

          {/* Dispensing status */}
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            safety?.dispensing_allowed
              ? 'bg-[#16A36A]/10 text-[#16A36A]'
              : 'bg-[#D94848]/10 text-[#D94848]'
          }`}>
            {safety?.dispensing_allowed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Dispensing Allowed
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Dispensing Locked
                {safety?.lock_reasons?.[0] && (
                  <span className="text-xs font-normal ml-2">— {safety.lock_reasons[0]}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Filter Health */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">Filter Health Summary</h3>
          {filters?.filters && filters.filters.length > 0 ? (
            <div className="space-y-3">
              {filters.filters.map((f: { component: string; health_pct: number; status: string }) => (
                <div key={f.component}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#172B43] capitalize">{f.component.replace('_', ' ')}</span>
                    <span className={`font-semibold ${
                      f.health_pct > 70 ? 'text-[#16A36A]' : f.health_pct > 40 ? 'text-[#E5A000]' : 'text-[#D94848]'
                    }`}>
                      {f.health_pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        f.health_pct > 70 ? 'bg-[#16A36A]' : f.health_pct > 40 ? 'bg-[#E5A000]' : 'bg-[#D94848]'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, f.health_pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#718096] text-sm">
              No filter data available
            </div>
          )}
        </div>
      </div>

      {/* Alerts + Recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">Recent Alerts</h3>
          {alerts?.alerts && alerts.alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.alerts.map((a: { id: string; severity: string; description: string; timestamp: string; source: string; acknowledged: boolean }) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${severityColor(a.severity)}`}
                >
                  {a.severity === 'critical' || a.severity === 'emergency' ? (
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : a.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.description}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">
                      {a.source} · {a.timestamp ? format(new Date(a.timestamp), 'HH:mm:ss') : ''}
                    </p>
                  </div>
                  {a.acknowledged && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A] flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-[#718096] text-sm">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#16A36A]/40" />
                <p>No recent alerts</p>
              </div>
            </div>
          )}
        </div>

        {/* RO Recovery */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-4">RO Recovery Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#F5F8FC] rounded-lg">
              <p className="text-xs text-[#718096]">Total Feed</p>
              <p className="text-lg font-bold text-[#172B43]">
                {(recovery?.total_feed ?? 0).toFixed(1)} <span className="text-xs font-normal text-[#718096]">L</span>
              </p>
            </div>
            <div className="p-3 bg-[#F5F8FC] rounded-lg">
              <p className="text-xs text-[#718096]">Permeate</p>
              <p className="text-lg font-bold text-[#172B43]">
                {(recovery?.total_permeate ?? 0).toFixed(1)} <span className="text-xs font-normal text-[#718096]">L</span>
              </p>
            </div>
            <div className="p-3 bg-[#F5F8FC] rounded-lg">
              <p className="text-xs text-[#718096]">Reject Recovered</p>
              <p className="text-lg font-bold text-[#16A36A]">
                {(recovery?.total_reuse ?? 0).toFixed(1)} <span className="text-xs font-normal text-[#718096]">L</span>
              </p>
            </div>
            <div className="p-3 bg-[#F5F8FC] rounded-lg">
              <p className="text-xs text-[#718096]">Recovery Ratio</p>
              <p className="text-lg font-bold text-[#1677C8]">
                {((recovery?.recovery_ratio ?? 0) * 100).toFixed(0)} <span className="text-xs font-normal text-[#718096]">%</span>
              </p>
            </div>
          </div>

          {/* Reuse tank */}
          <div className="mt-4 p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#718096]">Non-Potable Reuse Tank</span>
              <span className="font-semibold text-[#172B43]">
                {(recovery?.reuse_tank_level ?? 0).toFixed(1)} / {(recovery?.reuse_tank_capacity ?? 50).toFixed(0)} L
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-[#27B8D5] transition-all"
                style={{
                  width: `${Math.min(100, ((recovery?.reuse_tank_level ?? 0) / (recovery?.reuse_tank_capacity ?? 50)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-[#718096] mt-1 italic">
              Reject water stored for controlled non-potable reuse only
            </p>
          </div>
        </div>
      </div>

      {/* Timestamp footer */}
      <div className="flex items-center justify-between text-xs text-[#718096] pt-2">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
        {isSimRunning && (
          <span className="text-[#1677C8]">
            Session: {simStatus?.session_id ?? '—'} | Elapsed: {simStatus?.elapsed_seconds != null ? `${Math.floor(simStatus.elapsed_seconds)}s` : '—'}
          </span>
        )}
      </div>
    </div>
  );
}
