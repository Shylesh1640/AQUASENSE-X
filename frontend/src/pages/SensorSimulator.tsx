import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  Activity,
  Droplets,
  Gauge,
  Waves,
  Thermometer,
  Wind,
  AlertTriangle,
  Clock,
  Hash,
  Settings2,
  Shuffle,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';

type SimState = 'stopped' | 'starting' | 'running' | 'paused';

const SCENARIOS = [
  {
    value: 'normal',
    label: 'Normal Water',
    description: 'Clean municipal water supply with stable conditions',
  },
  {
    value: 'poor_quality',
    label: 'Poor Quality',
    description: 'High TDS, elevated turbidity, slightly acidic pH',
  },
  {
    value: 'abnormal',
    label: 'Abnormal Conditions',
    description: 'Normal start, then pressure drop at ~30s, sensor failure at ~60s',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Configure your own sensor parameters',
  },
];

const SPEEDS = [1, 2, 5, 10];

const FAULT_TYPES = [
  { value: '', label: 'None' },
  { value: 'stuck', label: 'Stuck' },
  { value: 'spike', label: 'Spike' },
  { value: 'drift', label: 'Fast Drift' },
  { value: 'dead', label: 'Dead' },
];

const SENSOR_CONFIG: Record<string, {
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}> = {
  tds: {
    label: 'TDS',
    unit: 'ppm',
    icon: <Droplets className="w-4 h-4" />,
    color: '#1677C8',
    min: 0,
    max: 1200,
    step: 10,
    defaultValue: 300,
  },
  ph: {
    label: 'pH',
    unit: '',
    icon: <Gauge className="w-4 h-4" />,
    color: '#16A36A',
    min: 0,
    max: 14,
    step: 0.1,
    defaultValue: 7.0,
  },
  turbidity: {
    label: 'Turbidity',
    unit: 'NTU',
    icon: <Waves className="w-4 h-4" />,
    color: '#E5A000',
    min: 0,
    max: 50,
    step: 0.5,
    defaultValue: 1.0,
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: <Thermometer className="w-4 h-4" />,
    color: '#D94848',
    min: 0,
    max: 60,
    step: 0.5,
    defaultValue: 25.0,
  },
  flow: {
    label: 'Flow Rate',
    unit: 'L/min',
    icon: <Wind className="w-4 h-4" />,
    color: '#27B8D5',
    min: 0,
    max: 5,
    step: 0.1,
    defaultValue: 1.5,
  },
  pressure: {
    label: 'Pressure',
    unit: 'bar',
    icon: <Activity className="w-4 h-4" />,
    color: '#8B5CF6',
    min: 0,
    max: 8,
    step: 0.1,
    defaultValue: 2.5,
  },
};

const SENSOR_ORDER = ['tds', 'ph', 'turbidity', 'temperature', 'flow', 'pressure'];

function StateIndicator({ state }: { state: SimState }) {
  const config: Record<SimState, { label: string; bg: string; fg: string; dot: string }> = {
    stopped: { label: 'STOPPED', bg: 'bg-gray-100', fg: 'text-gray-600', dot: 'bg-gray-400' },
    starting: { label: 'STARTING', bg: 'bg-[#1677C8]/10', fg: 'text-[#1677C8]', dot: 'bg-[#1677C8] animate-pulse' },
    running: { label: 'RUNNING', bg: 'bg-[#16A36A]/10', fg: 'text-[#16A36A]', dot: 'bg-[#16A36A] animate-pulse' },
    paused: { label: 'PAUSED', bg: 'bg-[#E5A000]/10', fg: 'text-[#E5A000]', dot: 'bg-[#E5A000]' },
  };
  const c = config[state] || config.stopped;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${c.bg}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
      <span className={`text-sm font-bold tracking-wider ${c.fg}`}>{c.label}</span>
    </div>
  );
}

export default function SensorSimulator() {
  const queryClient = useQueryClient();

  const [scenario, setScenario] = useState('normal');
  const [speed, setSpeed] = useState(1);
  const [seed, setSeed] = useState('');
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [manualValues, setManualValues] = useState<Record<string, number>>({});
  const [faults, setFaults] = useState<Record<string, string>>({});

  const { data: simStatus } = useQuery({
    queryKey: ['simulation', 'status'],
    queryFn: () => api.getSimulationStatus(),
    refetchInterval: 1000,
  });

  const { data: readings } = useQuery({
    queryKey: ['sensors', 'current'],
    queryFn: () => api.getCurrentReadings(),
    refetchInterval: 1500,
  });

  const state: SimState = (simStatus?.state as SimState) ?? 'stopped';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['simulation'] });
    queryClient.invalidateQueries({ queryKey: ['sensors'] });
  };

  const startMutation = useMutation({
    mutationFn: () => api.startSimulation({ scenario, seed: seed || undefined, speed }),
    onSuccess: () => {
      toast.success('Simulation started');
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed to start: ${err.message}`),
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseSimulation(),
    onSuccess: () => {
      toast.success('Simulation paused');
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed to pause: ${err.message}`),
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumeSimulation(),
    onSuccess: () => {
      toast.success('Simulation resumed');
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed to resume: ${err.message}`),
  });

  const stopMutation = useMutation({
    mutationFn: () => api.stopSimulation(),
    onSuccess: () => {
      toast.success('Simulation stopped');
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed to stop: ${err.message}`),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetSimulation(),
    onSuccess: () => {
      toast.success('Simulation reset');
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed to reset: ${err.message}`),
  });

  const speedMutation = useMutation({
    mutationFn: (mult: number) => api.setSimulationSpeed({ multiplier: mult }),
    onSuccess: () => {
      toast.success(`Speed set to ${speed}x`);
      invalidate();
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ sensor, value }: { sensor: string; value: number }) =>
      api.adjustSensor({ sensor_type: sensor, value }),
    onSuccess: (_, vars) => toast.success(`${vars.sensor} adjusted`),
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const faultMutation = useMutation({
    mutationFn: ({ sensor, fault }: { sensor: string; fault: string }) =>
      api.injectFault({ sensor_type: sensor, fault_type: fault }),
    onSuccess: (_, vars) =>
      toast.success(vars.fault ? `Fault injected on ${vars.sensor}` : `Fault cleared on ${vars.sensor}`),
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const sensorMap: Record<string, { value: number }> = {};
  if (readings?.readings) {
    for (const r of readings.readings) {
      sensorMap[r.sensor_type] = r;
    }
  }

  const isAnyLoading =
    startMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    stopMutation.isPending ||
    resetMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#172B43]">Sensor Simulator</h2>
        <p className="text-sm text-[#718096]">
          Control the simulation engine, configure scenarios, and inject faults
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <StateIndicator state={state} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => startMutation.mutate()}
              disabled={state !== 'stopped' || isAnyLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#16A36A] text-white rounded-lg text-sm font-medium hover:bg-[#16A36A]/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={state !== 'running' || isAnyLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E5A000] text-white rounded-lg text-sm font-medium hover:bg-[#E5A000]/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={state !== 'paused' || isAnyLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1677C8] text-white rounded-lg text-sm font-medium hover:bg-[#1677C8]/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
            <button
              onClick={() => stopMutation.mutate()}
              disabled={(state !== 'running' && state !== 'paused') || isAnyLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D94848] text-white rounded-lg text-sm font-medium hover:bg-[#D94848]/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
            <button
              onClick={() => resetMutation.mutate()}
              disabled={isAnyLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scenario selector */}
          <div>
            <label className="block text-xs font-medium text-[#172B43] mb-2">Scenario</label>
            <div className="relative">
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                disabled={state === 'running' || state === 'paused'}
                className="w-full appearance-none bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#172B43] focus:outline-none focus:ring-2 focus:ring-[#1677C8]/30 focus:border-[#1677C8] disabled:opacity-50"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096] pointer-events-none" />
            </div>
            <p className="text-xs text-[#718096] mt-1">
              {SCENARIOS.find((s) => s.value === scenario)?.description}
            </p>
          </div>

          {/* Speed selector */}
          <div>
            <label className="block text-xs font-medium text-[#172B43] mb-2">Simulation Speed</label>
            <div className="flex items-center gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (state === 'running' || state === 'paused') {
                      speedMutation.mutate(s);
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    speed === s
                      ? 'bg-[#1677C8] text-white shadow-sm'
                      : 'bg-[#F5F8FC] text-[#718096] hover:bg-[#1677C8]/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-xs text-[#718096] mt-1">
              {speed}x → ~{(1000 / speed).toFixed(0)}ms per tick
            </p>
          </div>

          {/* Seed input */}
          <div>
            <label className="block text-xs font-medium text-[#172B43] mb-2">Random Seed (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                disabled={state === 'running' || state === 'paused'}
                placeholder="e.g. 42"
                className="flex-1 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#172B43] placeholder-[#718096]/50 focus:outline-none focus:ring-2 focus:ring-[#1677C8]/30 focus:border-[#1677C8] disabled:opacity-50"
              />
              <button
                onClick={() => setSeed(String(Math.floor(Math.random() * 100000)))}
                disabled={state === 'running' || state === 'paused'}
                className="p-2.5 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                title="Generate random seed"
              >
                <Shuffle className="w-4 h-4 text-[#718096]" />
              </button>
            </div>
            <p className="text-xs text-[#718096] mt-1">
              Set a seed for reproducible simulations
            </p>
          </div>
        </div>
      </div>

      {/* Sensor Adjustment Panel */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 className="w-5 h-5 text-[#1677C8]" />
          <h3 className="text-sm font-semibold text-[#172B43]">Sensor Controls</h3>
          <span className="ml-auto text-xs text-[#718096]">Override individual sensor values or inject faults</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SENSOR_ORDER.map((key) => {
            const cfg = SENSOR_CONFIG[key];
            const isOverride = overrides[key] ?? false;
            const currentValue = sensorMap[key]?.value ?? cfg.defaultValue;
            const displayValue = isOverride ? (manualValues[key] ?? cfg.defaultValue) : currentValue;
            const currentFault = faults[key] ?? '';

            return (
              <div
                key={key}
                className={`border rounded-lg p-4 transition ${
                  isOverride ? 'border-[#1677C8] bg-[#1677C8]/5' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span className="text-sm font-semibold text-[#172B43]">{cfg.label}</span>
                    {cfg.unit && <span className="text-xs text-[#718096]">({cfg.unit})</span>}
                  </div>
                  <span className="text-lg font-bold text-[#172B43]">
                    {displayValue.toFixed(key === 'ph' ? 1 : key === 'turbidity' ? 2 : 1)}
                  </span>
                </div>

                {/* Slider */}
                <div className="mb-3">
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={isOverride ? (manualValues[key] ?? cfg.defaultValue) : currentValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setManualValues((prev) => ({ ...prev, [key]: val }));
                      if (isOverride && (state === 'running' || state === 'paused')) {
                        adjustMutation.mutate({ sensor: key, value: val });
                      }
                    }}
                    disabled={!isOverride || (state !== 'running' && state !== 'paused')}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: `linear-gradient(to right, ${cfg.color} 0%, ${cfg.color} ${((displayValue - cfg.min) / (cfg.max - cfg.min)) * 100}%, #E2E8F0 ${((displayValue - cfg.min) / (cfg.max - cfg.min)) * 100}%, #E2E8F0 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-[#718096] mt-0.5">
                    <span>{cfg.min}</span>
                    <span>{cfg.max}</span>
                  </div>
                </div>

                {/* Manual input + Override toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={isOverride ? (manualValues[key] ?? cfg.defaultValue) : currentValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setManualValues((prev) => ({ ...prev, [key]: val }));
                        if (isOverride && (state === 'running' || state === 'paused')) {
                          adjustMutation.mutate({ sensor: key, value: val });
                        }
                      }
                    }}
                    disabled={!isOverride || (state !== 'running' && state !== 'paused')}
                    className="flex-1 bg-[#F5F8FC] border border-[#E2E8F0] rounded px-2 py-1.5 text-xs text-[#172B43] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#1677C8]/30"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOverride}
                      onChange={(e) => setOverrides((prev) => ({ ...prev, [key]: e.target.checked }))}
                      disabled={state !== 'running' && state !== 'paused'}
                      className="w-3.5 h-3.5 rounded border-[#E2E8F0] text-[#1677C8] focus:ring-[#1677C8]/30"
                    />
                    <span className="text-xs text-[#718096]">Override</span>
                  </label>
                </div>

                {/* Fault injection */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#718096]" />
                  <select
                    value={currentFault}
                    onChange={(e) => {
                      const fault = e.target.value;
                      setFaults((prev) => ({ ...prev, [key]: fault }));
                      if (state === 'running' || state === 'paused') {
                        faultMutation.mutate({ sensor: key, fault });
                      }
                    }}
                    disabled={state !== 'running' && state !== 'paused'}
                    className="flex-1 appearance-none bg-[#F5F8FC] border border-[#E2E8F0] rounded px-2 py-1 text-xs text-[#172B43] disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#1677C8]/30"
                  >
                    {FAULT_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Info */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#172B43] mb-4">Simulation Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-1">
              <Hash className="w-3 h-3" />
              Tick Count
            </div>
            <p className="text-lg font-bold text-[#172B43]">{simStatus?.tick_count ?? 0}</p>
          </div>

          <div className="p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-1">
              <Clock className="w-3 h-3" />
              Elapsed Time
            </div>
            <p className="text-lg font-bold text-[#172B43]">
              {simStatus?.elapsed_seconds != null
                ? `${Math.floor(simStatus.elapsed_seconds / 60)}m ${Math.floor(simStatus.elapsed_seconds % 60)}s`
                : '0m 0s'}
            </p>
          </div>

          <div className="p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-1">
              <Zap className="w-3 h-3" />
              Speed
            </div>
            <p className="text-lg font-bold text-[#172B43]">{simStatus?.speed ?? speed}x</p>
          </div>

          <div className="p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-1">
              <Activity className="w-3 h-3" />
              Session
            </div>
            <p className="text-sm font-mono font-medium text-[#172B43] truncate">
              {simStatus?.session_id ?? '—'}
            </p>
          </div>

          <div className="p-3 bg-[#F5F8FC] rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-[#718096] mb-1">
              <AlertTriangle className="w-3 h-3" />
              Active Faults
            </div>
            <p className="text-lg font-bold text-[#172B43]">
              {simStatus?.active_faults?.length ?? Object.values(faults).filter(Boolean).length}
            </p>
          </div>
        </div>

        {/* Active faults list */}
        {simStatus?.active_faults && simStatus.active_faults.length > 0 && (
          <div className="mt-4 p-3 bg-[#D94848]/5 border border-[#D94848]/20 rounded-lg">
            <p className="text-xs font-medium text-[#D94848] mb-2">Active Faults:</p>
            <div className="flex flex-wrap gap-2">
              {simStatus.active_faults.map((f: { sensor_type: string; fault_type: string }, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-[#D94848]/10 text-[#D94848] rounded text-xs font-medium"
                >
                  {f.sensor_type}: {f.fault_type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-[#F5F8FC] rounded-lg text-xs text-[#718096] italic">
          All sensor readings are generated by the simulation engine. No physical hardware is connected.
          Simulation data should not be used for real water quality assessment.
        </div>
      </div>
    </div>
  );
}
