import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Droplets,
  Gauge,
  Waves,
  Thermometer,
  Wind,
  Activity,
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { api } from '../services/api';

const SENSOR_CONFIG: Record<string, {
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
  warningMin: number;
  warningMax: number;
}> = {
  tds: {
    label: 'TDS',
    unit: 'ppm',
    icon: <Droplets className="w-5 h-5" />,
    color: '#1677C8',
    min: 0,
    max: 1200,
    normalMin: 0,
    normalMax: 300,
    warningMin: 300,
    warningMax: 600,
  },
  ph: {
    label: 'pH',
    unit: '',
    icon: <Gauge className="w-5 h-5" />,
    color: '#16A36A',
    min: 0,
    max: 14,
    normalMin: 6.5,
    normalMax: 8.5,
    warningMin: 5.5,
    warningMax: 9.5,
  },
  turbidity: {
    label: 'Turbidity',
    unit: 'NTU',
    icon: <Waves className="w-5 h-5" />,
    color: '#E5A000',
    min: 0,
    max: 50,
    normalMin: 0,
    normalMax: 1,
    warningMin: 1,
    warningMax: 5,
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: <Thermometer className="w-5 h-5" />,
    color: '#D94848',
    min: 0,
    max: 60,
    normalMin: 10,
    normalMax: 35,
    warningMin: 5,
    warningMax: 45,
  },
  flow: {
    label: 'Flow Rate',
    unit: 'L/min',
    icon: <Wind className="w-5 h-5" />,
    color: '#27B8D5',
    min: 0,
    max: 5,
    normalMin: 0.5,
    normalMax: 3.0,
    warningMin: 0.2,
    warningMax: 5.0,
  },
  pressure: {
    label: 'Pressure',
    unit: 'bar',
    icon: <Activity className="w-5 h-5" />,
    color: '#8B5CF6',
    min: 0,
    max: 8,
    normalMin: 1.0,
    normalMax: 4.0,
    warningMin: 0.5,
    warningMax: 6.0,
  },
};

function getStatus(sensorType: string, value: number): 'normal' | 'warning' | 'critical' {
  const cfg = SENSOR_CONFIG[sensorType];
  if (!cfg) return 'normal';
  if (value >= cfg.normalMin && value <= cfg.normalMax) return 'normal';
  if (value >= cfg.warningMin && value <= cfg.warningMax) return 'warning';
  return 'critical';
}

function statusLabel(level: 'normal' | 'warning' | 'critical') {
  return {
    normal: { text: 'Normal', bg: 'bg-[#16A36A]/10', fg: 'text-[#16A36A]' },
    warning: { text: 'Warning', bg: 'bg-[#E5A000]/10', fg: 'text-[#E5A000]' },
    critical: { text: 'Critical', bg: 'bg-[#D94848]/10', fg: 'text-[#D94848]' },
  }[level];
}

function RangeIndicator({ sensorType, value }: { sensorType: string; value: number }) {
  const cfg = SENSOR_CONFIG[sensorType];
  if (!cfg) return null;
  const pct = Math.max(0, Math.min(100, ((value - cfg.min) / (cfg.max - cfg.min)) * 100));
  const normalStart = ((cfg.normalMin - cfg.min) / (cfg.max - cfg.min)) * 100;
  const normalEnd = ((cfg.normalMax - cfg.min) / (cfg.max - cfg.min)) * 100;
  const warningStart = ((cfg.warningMin - cfg.min) / (cfg.max - cfg.min)) * 100;
  const warningEnd = ((cfg.warningMax - cfg.min) / (cfg.max - cfg.min)) * 100;

  return (
    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
      {/* Critical zones at edges */}
      <div className="absolute inset-0 bg-[#D94848]/20 rounded-full" />
      {/* Warning zone */}
      <div
        className="absolute h-full bg-[#E5A000]/30"
        style={{ left: `${warningStart}%`, width: `${warningEnd - warningStart}%` }}
      />
      {/* Normal zone */}
      <div
        className="absolute h-full bg-[#16A36A]/30"
        style={{ left: `${normalStart}%`, width: `${normalEnd - normalStart}%` }}
      />
      {/* Indicator dot */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${pct}%`,
          transform: `translate(-50%, -50%)`,
          backgroundColor: getStatus(sensorType, value) === 'normal' ? '#16A36A' : getStatus(sensorType, value) === 'warning' ? '#E5A000' : '#D94848',
        }}
      />
    </div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-full mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace('#', '')})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SENSOR_ORDER = ['tds', 'ph', 'turbidity', 'temperature', 'flow', 'pressure'];

export default function LiveMonitoring() {
  const sparkHistoryRef = useRef<Record<string, number[]>>({
    tds: [], ph: [], turbidity: [], temperature: [], flow: [], pressure: [],
  });

  const [sparkData, setSparkData] = useState<Record<string, number[]>>({
    tds: [], ph: [], turbidity: [], temperature: [], flow: [], pressure: [],
  });

  const [seriesVisible, setSeriesVisible] = useState<Record<string, boolean>>({
    tds: true, ph: true, turbidity: true, temperature: true, flow: true, pressure: true,
  });

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [historyData, setHistoryData] = useState<Array<Record<string, number | string>>>([]);

  const { data: readings } = useQuery({
    queryKey: ['sensors', 'current'],
    queryFn: () => api.getCurrentReadings(),
    refetchInterval: 2000,
  });

  const { data: safety } = useQuery({
    queryKey: ['safety', 'status'],
    queryFn: () => api.getSafetyStatus(),
    refetchInterval: 2000,
  });

  const { data: verification } = useQuery({
    queryKey: ['verification', 'latest'],
    queryFn: () => api.getVerification(),
    refetchInterval: 3000,
  });

  // Build sensor map
  const sensorMap: Record<string, { value: number; unit: string; timestamp: string; is_valid: boolean }> = {};
  if (readings?.readings) {
    for (const r of readings.readings) {
      sensorMap[r.sensor_type] = r;
    }
  }

  // Update sparkline data when readings change
  useEffect(() => {
    if (!readings?.readings) return;
    const newSpark = { ...sparkHistoryRef.current };
    for (const r of readings.readings) {
      if (newSpark[r.sensor_type]) {
        newSpark[r.sensor_type] = [...newSpark[r.sensor_type].slice(-19), r.value];
      }
    }
    sparkHistoryRef.current = newSpark;
    setSparkData({ ...newSpark });

    // Update history for multi-series chart
    setHistoryData((prev) => {
      const point: Record<string, number | string> = {
        time: format(new Date(), 'HH:mm:ss'),
      };
      for (const r of readings.readings) {
        point[r.sensor_type] = r.value;
      }
      const updated = [...prev, point];
      return updated.slice(-100);
    });
  }, [readings]);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/api/v1/ws/live`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => {
          setWsConnected(false);
        };
        ws.onmessage = () => {
          // WebSocket data would be handled by query invalidation
        };
      } catch {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const toggleSeries = useCallback((key: string) => {
    setSeriesVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#172B43]">Live Monitoring</h2>
          <p className="text-sm text-[#718096]">Real-time sensor readings and system status</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          wsConnected ? 'bg-[#16A36A]/10 text-[#16A36A]' : 'bg-[#D94848]/10 text-[#D94848]'
        }`}>
          {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {wsConnected ? 'Live' : 'Polling'}
        </div>
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SENSOR_ORDER.map((key) => {
          const cfg = SENSOR_CONFIG[key];
          const reading = sensorMap[key];
          const value = reading?.value ?? 0;
          const status = getStatus(key, value);
          const sl = statusLabel(status);
          const spark = sparkData[key] || [];

          return (
            <div
              key={key}
              className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#718096]">{cfg.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#172B43]">
                        {reading ? value.toFixed(key === 'ph' ? 1 : key === 'turbidity' ? 2 : 1) : '—'}
                      </span>
                      {cfg.unit && <span className="text-sm text-[#718096]">{cfg.unit}</span>}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sl.bg} ${sl.fg}`}>
                  {sl.text}
                </span>
              </div>

              <RangeIndicator sensorType={key} value={value} />

              <MiniSparkline data={spark} color={cfg.color} />

              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-[#718096]">
                  Range: {cfg.min}–{cfg.max} {cfg.unit}
                </span>
                {reading?.timestamp && (
                  <span className="text-[10px] text-[#718096] flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {format(new Date(reading.timestamp), 'HH:mm:ss')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-series trend chart */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#172B43]">Sensor Trends (Last 100 Readings)</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {SENSOR_ORDER.map((key) => {
              const cfg = SENSOR_CONFIG[key];
              const visible = seriesVisible[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleSeries(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    visible ? 'opacity-100' : 'opacity-40'
                  }`}
                  style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {historyData.length > 1 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#718096" />
              <YAxis tick={{ fontSize: 10 }} stroke="#718096" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SENSOR_ORDER.map((key) => {
                const cfg = SENSOR_CONFIG[key];
                return seriesVisible[key] ? (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={cfg.color}
                    name={cfg.label}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                ) : null;
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-[#718096] text-sm">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-[#718096]/40" />
              <p>Waiting for sensor data...</p>
              <p className="text-xs mt-1">Start a simulation to see live trends</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom row: Dispensing + Verification + WS Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispensing Status */}
        <div
          className={`rounded-lg border-2 p-6 shadow-sm ${
            safety?.dispensing === "allowed"
              ? 'bg-[#16A36A]/5 border-[#16A36A]'
              : 'bg-[#D94848]/5 border-[#D94848]'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {safety?.dispensing === "allowed" ? (
              <ShieldCheck className="w-8 h-8 text-[#16A36A]" />
            ) : (
              <ShieldX className="w-8 h-8 text-[#D94848]" />
            )}
            <div>
              <p className={`text-lg font-bold ${
                safety?.dispensing === "allowed" ? 'text-[#16A36A]' : 'text-[#D94848]'
              }`}>
                {safety?.dispensing === "allowed" ? 'DISPENSING ALLOWED' : 'DISPENSING LOCKED'}
              </p>
              <p className="text-xs text-[#718096]">Safety controller status</p>
            </div>
          </div>

          {!safety?.dispensing === "allowed" && safety?.lock_reasons && safety.lock_reasons.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-xs font-medium text-[#D94848]">Lock reasons:</p>
              {safety.lock_reasons.map((reason: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#D94848]/80">
                  <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Output Verification */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#1677C8]" />
            <h3 className="text-sm font-semibold text-[#172B43]">Output Verification</h3>
          </div>

          {verification ? (
            <div>
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 ${
                verification.status === 'verified'
                  ? 'bg-[#16A36A]/10 text-[#16A36A]'
                  : verification.status === 'warning'
                  ? 'bg-[#E5A000]/10 text-[#E5A000]'
                  : verification.status === 'failed'
                  ? 'bg-[#D94848]/10 text-[#D94848]'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {verification.status === 'verified' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : verification.status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-semibold text-sm capitalize">{verification.status}</span>
              </div>

              {verification.outlet_tds && (
                <div className="space-y-1 text-xs">
                  {Object.entries(verification.outlet_tds as Record<string, number>).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#718096] capitalize">{key}</span>
                      <span className="font-medium text-[#172B43]">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                    </div>
                  ))}
                </div>
              )}

              {verification.timestamp && (
                <p className="text-[10px] text-[#718096] mt-2">
                  Verified at: {format(new Date(verification.timestamp), 'HH:mm:ss')}
                </p>
              )}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-[#718096] text-sm">
              No verification data
            </div>
          )}
        </div>

        {/* WebSocket / Connection */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#172B43] mb-3">Connection Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-[#16A36A] animate-pulse' : 'bg-[#D94848]'}`} />
              <div>
                <p className="text-sm font-medium text-[#172B43]">
                  WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-xs text-[#718096]">
                  {wsConnected ? 'Receiving live updates' : 'Falling back to API polling (2s)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#16A36A]" />
              <div>
                <p className="text-sm font-medium text-[#172B43]">API: Connected</p>
                <p className="text-xs text-[#718096]">Polling interval: 2000ms</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#1677C8]" />
              <div>
                <p className="text-sm font-medium text-[#172B43]">Data Points</p>
                <p className="text-xs text-[#718096]">{historyData.length} readings in buffer</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2 bg-[#F5F8FC] rounded text-[10px] text-[#718096] italic">
            All displayed readings are from the simulation engine
          </div>
        </div>
      </div>
    </div>
  );
}
