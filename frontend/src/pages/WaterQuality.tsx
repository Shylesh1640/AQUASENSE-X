import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Droplets,
  Gauge,
  Waves,
  Thermometer,
  Wind,
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Info,
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
  ReferenceLine,
} from 'recharts';
import { api } from '../services/api';

interface ParameterInfo {
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  explanation: string;
  tooltip: string;
  normalMin: number;
  normalMax: number;
  warningMin: number;
  warningMax: number;
  absMin: number;
  absMax: number;
}

const PARAMETERS: Record<string, ParameterInfo> = {
  tds: {
    label: 'Total Dissolved Solids (TDS)',
    unit: 'ppm',
    icon: <Droplets className="w-5 h-5" />,
    color: '#1677C8',
    explanation: 'Estimated dissolved solids. Lower values generally indicate purer water.',
    tooltip: 'TDS measures the total amount of dissolved minerals, salts, and organic matter in water. It is not a direct measure of specific contaminants.',
    normalMin: 0,
    normalMax: 300,
    warningMin: 0,
    warningMax: 600,
    absMin: 0,
    absMax: 1200,
  },
  ph: {
    label: 'pH Level',
    unit: '',
    icon: <Gauge className="w-5 h-5" />,
    color: '#16A36A',
    explanation: 'Measures acidity/alkalinity. 7 is neutral. Drinking water: 6.5–8.5.',
    tooltip: 'pH indicates how acidic or alkaline the water is on a scale of 0 to 14. Values below 7 are acidic, above 7 are alkaline. Most drinking water standards recommend 6.5–8.5.',
    normalMin: 6.5,
    normalMax: 8.5,
    warningMin: 5.5,
    warningMax: 9.5,
    absMin: 0,
    absMax: 14,
  },
  turbidity: {
    label: 'Turbidity',
    unit: 'NTU',
    icon: <Waves className="w-5 h-5" />,
    color: '#E5A000',
    explanation: 'Measures water cloudiness. Lower is clearer.',
    tooltip: 'Turbidity measures how much light is scattered by particles in the water. High turbidity indicates suspended solids. Drinking water should be below 1 NTU.',
    normalMin: 0,
    normalMax: 1,
    warningMin: 0,
    warningMax: 5,
    absMin: 0,
    absMax: 50,
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: <Thermometer className="w-5 h-5" />,
    color: '#D94848',
    explanation: 'Water temperature. Affects treatment efficiency.',
    tooltip: 'Water temperature influences chemical reaction rates, dissolved oxygen levels, and the effectiveness of treatment processes like RO membranes.',
    normalMin: 10,
    normalMax: 35,
    warningMin: 5,
    warningMax: 45,
    absMin: 0,
    absMax: 60,
  },
  flow: {
    label: 'Flow Rate',
    unit: 'L/min',
    icon: <Wind className="w-5 h-5" />,
    color: '#27B8D5',
    explanation: 'Water flow rate through the system.',
    tooltip: 'Flow rate indicates how much water passes through the purification system per minute. Abnormal flow can indicate blockages or pump issues.',
    normalMin: 0.5,
    normalMax: 3.0,
    warningMin: 0.2,
    warningMax: 5.0,
    absMin: 0,
    absMax: 5,
  },
  pressure: {
    label: 'Pressure',
    unit: 'bar',
    icon: <Activity className="w-5 h-5" />,
    color: '#8B5CF6',
    explanation: 'Hydraulic pressure in the treatment system.',
    tooltip: 'System pressure is critical for RO membrane operation and overall system health. Abnormal pressure may indicate filter clogging or pump issues.',
    normalMin: 1.0,
    normalMax: 4.0,
    warningMin: 0.5,
    warningMax: 6.0,
    absMin: 0,
    absMax: 8,
  },
};

const PARAM_ORDER = ['tds', 'ph', 'turbidity', 'temperature', 'flow', 'pressure'];
const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
];

function classifyValue(key: string, value: number): 'normal' | 'warning' | 'critical' {
  const p = PARAMETERS[key];
  if (!p) return 'normal';
  if (key === 'ph') {
    if (value >= p.normalMin && value <= p.normalMax) return 'normal';
    if (value >= p.warningMin && value <= p.warningMax) return 'warning';
    return 'critical';
  }
  if (key === 'tds' || key === 'turbidity') {
    if (value <= p.normalMax) return 'normal';
    if (value <= p.warningMax) return 'warning';
    return 'critical';
  }
  if (value >= p.normalMin && value <= p.normalMax) return 'normal';
  if (value >= p.warningMin && value <= p.warningMax) return 'warning';
  return 'critical';
}

function getOverallLevel(assessments: Record<string, 'normal' | 'warning' | 'critical'>): 'normal' | 'warning' | 'critical' {
  const values = Object.values(assessments);
  if (values.includes('critical')) return 'critical';
  if (values.includes('warning')) return 'warning';
  return 'normal';
}

function ParameterGauge({ paramKey, value }: { paramKey: string; value: number }) {
  const p = PARAMETERS[paramKey];
  if (!p) return null;

  const totalWidth = p.absMax - p.absMin;
  const normalStart = ((p.normalMin - p.absMin) / totalWidth) * 100;
  const normalEnd = ((p.normalMax - p.absMin) / totalWidth) * 100;
  const warningStart = ((p.warningMin - p.absMin) / totalWidth) * 100;
  const warningEnd = ((p.warningMax - p.absMin) / totalWidth) * 100;
  const valuePct = Math.max(0, Math.min(100, ((value - p.absMin) / totalWidth) * 100));
  const level = classifyValue(paramKey, value);

  return (
    <div className="mt-3">
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Critical background */}
        <div className="absolute inset-0 bg-[#D94848]/15 rounded-full" />
        {/* Warning zone */}
        <div
          className="absolute h-full bg-[#E5A000]/25"
          style={{ left: `${warningStart}%`, width: `${warningEnd - warningStart}%` }}
        />
        {/* Normal zone */}
        <div
          className="absolute h-full bg-[#16A36A]/30"
          style={{ left: `${normalStart}%`, width: `${normalEnd - normalStart}%` }}
        />
        {/* Value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg z-10"
          style={{
            left: `${valuePct}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: level === 'normal' ? '#16A36A' : level === 'warning' ? '#E5A000' : '#D94848',
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-[#718096]">
        <span>{p.absMin} {p.unit}</span>
        <div className="flex gap-4">
          <span className="text-[#16A36A]">
            Normal: {p.normalMin}–{p.normalMax}
          </span>
          <span className="text-[#E5A000]">
            Warning: {p.warningMin}–{p.warningMax}
          </span>
        </div>
        <span>{p.absMax} {p.unit}</span>
      </div>
    </div>
  );
}

function TooltipBubble({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 text-[#718096] hover:text-[#1677C8] transition"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#172B43] text-white text-xs rounded-lg shadow-xl">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#172B43] rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function WaterQuality() {
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set(['tds', 'ph', 'turbidity']));
  const [timeRange, setTimeRange] = useState(1);

  const { data: quality } = useQuery({
    queryKey: ['water-quality', 'current'],
    queryFn: () => api.getWaterQuality(),
    refetchInterval: 2000,
  });

  const { data: readings } = useQuery({
    queryKey: ['sensors', 'current'],
    queryFn: () => api.getCurrentReadings(),
    refetchInterval: 2000,
  });

  const { data: history } = useQuery({
    queryKey: ['water-quality', 'history', timeRange],
    queryFn: () => api.getWaterQualityHistory({ hours: timeRange }),
    refetchInterval: 5000,
  });

  // Build sensor map
  const sensorMap: Record<string, { value: number; unit: string; is_valid: boolean; timestamp: string }> = {};
  if (readings?.readings) {
    for (const r of readings.readings) {
      sensorMap[r.sensor_type] = r;
    }
  }

  // Per-parameter assessment
  const assessments: Record<string, 'normal' | 'warning' | 'critical'> = {};
  for (const key of PARAM_ORDER) {
    const val = sensorMap[key]?.value;
    assessments[key] = val != null ? classifyValue(key, val) : 'normal';
  }

  const overallLevel = getOverallLevel(assessments);
  const overallText = quality?.overall_message ??
    (overallLevel === 'normal'
      ? 'All measured parameters are within normal operating ranges. The purification system is functioning as expected.'
      : overallLevel === 'warning'
      ? 'One or more parameters are outside normal range but within acceptable limits. Investigation may be advisable.'
      : 'One or more parameters are in a critical range. Treatment adjustments or investigation are recommended.');

  const warningParams = PARAM_ORDER.filter((k) => assessments[k] === 'warning');
  const criticalParams = PARAM_ORDER.filter((k) => assessments[k] === 'critical');

  const toggleParam = (key: string) => {
    setSelectedParams((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const trendData = history?.readings
    ? history.readings.map((r: Record<string, number | string>, i: number) => ({
        idx: i,
        time: r.timestamp ? format(new Date(r.timestamp as string), 'HH:mm') : `${i}`,
        ...r,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#172B43]">Water Quality Analysis</h2>
        <p className="text-sm text-[#718096]">
          Multi-parameter water quality assessment based on simulated sensor data
        </p>
      </div>

      {/* Overall Assessment */}
      <div
        className={`rounded-lg border-2 p-6 ${
          overallLevel === 'normal'
            ? 'bg-[#16A36A]/5 border-[#16A36A]'
            : overallLevel === 'warning'
            ? 'bg-[#E5A000]/5 border-[#E5A000]'
            : 'bg-[#D94848]/5 border-[#D94848]'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            overallLevel === 'normal'
              ? 'bg-[#16A36A]/10'
              : overallLevel === 'warning'
              ? 'bg-[#E5A000]/10'
              : 'bg-[#D94848]/10'
          }`}>
            {overallLevel === 'normal' ? (
              <ShieldCheck className={`w-8 h-8 text-[#16A36A]`} />
            ) : overallLevel === 'warning' ? (
              <AlertTriangle className={`w-8 h-8 text-[#E5A000]`} />
            ) : (
              <XCircle className={`w-8 h-8 text-[#D94848]`} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${
              overallLevel === 'normal'
                ? 'text-[#16A36A]'
                : overallLevel === 'warning'
                ? 'text-[#E5A000]'
                : 'text-[#D94848]'
            }`}>
              Water Quality: {overallLevel.charAt(0).toUpperCase() + overallLevel.slice(1)}
            </h3>
            <p className="text-sm text-[#172B43] mt-1">{overallText}</p>

            {(warningParams.length > 0 || criticalParams.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {criticalParams.map((k) => (
                  <span key={k} className="px-2 py-1 bg-[#D94848]/10 text-[#D94848] rounded text-xs font-medium">
                    {PARAMETERS[k]?.label.split('(')[0].trim()}: Critical
                  </span>
                ))}
                {warningParams.map((k) => (
                  <span key={k} className="px-2 py-1 bg-[#E5A000]/10 text-[#E5A000] rounded text-xs font-medium">
                    {PARAMETERS[k]?.label.split('(')[0].trim()}: Warning
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 p-2 bg-white/60 rounded text-xs text-[#718096] italic flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          This assessment is based on simulated sensor data and configured thresholds. It is an internal
          software indicator, not a certified water safety result.
        </div>
      </div>

      {/* Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PARAM_ORDER.map((key) => {
          const p = PARAMETERS[key];
          const reading = sensorMap[key];
          const value = reading?.value ?? 0;
          const level = assessments[key];
          const levelColors = {
            normal: { bg: 'bg-[#16A36A]/10', fg: 'text-[#16A36A]', label: 'Normal' },
            warning: { bg: 'bg-[#E5A000]/10', fg: 'text-[#E5A000]', label: 'Warning' },
            critical: { bg: 'bg-[#D94848]/10', fg: 'text-[#D94848]', label: 'Critical' },
          };
          const lc = levelColors[level];

          return (
            <div key={key} className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: p.color }}>{p.icon}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-[#172B43]">{p.label}</span>
                    <TooltipBubble text={p.tooltip} />
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lc.bg} ${lc.fg}`}>
                  {lc.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-bold text-[#172B43]">
                  {reading ? value.toFixed(key === 'ph' ? 1 : key === 'turbidity' ? 2 : 1) : '—'}
                </span>
                {p.unit && <span className="text-sm text-[#718096]">{p.unit}</span>}
              </div>

              <p className="text-xs text-[#718096] leading-relaxed">{p.explanation}</p>

              <ParameterGauge paramKey={key} value={value} />

              {reading?.timestamp && (
                <p className="text-[10px] text-[#718096] mt-2 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Last reading: {format(new Date(reading.timestamp), 'HH:mm:ss')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-[#172B43]">Water Quality Trend</h3>

          <div className="flex items-center gap-4">
            {/* Parameter toggles */}
            <div className="flex items-center gap-1.5">
              {PARAM_ORDER.map((key) => {
                const p = PARAMETERS[key];
                const active = selectedParams.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleParam(key)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      active ? 'opacity-100 shadow-sm' : 'opacity-40'
                    }`}
                    style={{
                      color: p.color,
                      backgroundColor: active ? `${p.color}15` : '#F5F8FC',
                    }}
                  >
                    {p.label.split('(')[0].split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Time range */}
            <div className="flex items-center gap-1 bg-[#F5F8FC] rounded-lg p-1">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.hours}
                  onClick={() => setTimeRange(tr.hours)}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    timeRange === tr.hours
                      ? 'bg-[#1677C8] text-white'
                      : 'text-[#718096] hover:bg-white'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {trendData.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
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
              {PARAM_ORDER.filter((k) => selectedParams.has(k)).map((key) => {
                const p = PARAMETERS[key];
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={p.color}
                    name={p.label.split('(')[0].trim()}
                    dot={false}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-[#718096] text-sm">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-[#718096]/40" />
              <p>No historical data available</p>
              <p className="text-xs mt-1">Start a simulation to collect water quality data</p>
            </div>
          </div>
        )}
      </div>

      {/* Educational note */}
      <div className="bg-[#F5F8FC] rounded-lg border border-[#E2E8F0] p-4">
        <h4 className="text-xs font-semibold text-[#172B43] mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1677C8]" />
          Understanding Water Quality Parameters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">TDS</strong> — An estimate of dissolved solids in water.
            Lower TDS generally indicates purer water, but does not identify specific contaminants.
          </div>
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">pH</strong> — Indicates how acidic or alkaline water is
            on a 0–14 scale. Drinking water standards: 6.5–8.5.
          </div>
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">Turbidity</strong> — Measures how cloudy water is due to
            suspended particles. Below 1 NTU is typically acceptable.
          </div>
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">Temperature</strong> — Affects treatment efficiency and
            membrane performance. Optimal: 10–35°C.
          </div>
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">Flow Rate</strong> — Measures how much water moves through
            the system per minute. Abnormal flow may indicate blockages.
          </div>
          <div className="text-xs text-[#718096]">
            <strong className="text-[#172B43]">Pressure</strong> — Indicates hydraulic pressure. Required
            for RO operation. Abnormal pressure may indicate filter clogging.
          </div>
        </div>
        <p className="text-[10px] text-[#718096] mt-3 italic">
          Note: TDS, pH and turbidity sensors alone cannot identify specific contaminants such as lead,
          arsenic or PFAS. Laboratory testing is required for contaminant-specific verification.
        </p>
      </div>
    </div>
  );
}
