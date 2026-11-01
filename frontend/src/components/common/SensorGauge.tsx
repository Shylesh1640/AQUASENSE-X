import clsx from 'clsx';

interface SensorGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  color?: string;
}

export default function SensorGauge({
  value,
  min,
  max,
  label,
  unit,
  warningLow,
  warningHigh,
  criticalLow,
  criticalHigh,
  color = '#1677C8',
}: SensorGaugeProps) {
  const range = max - min;
  const pct = Math.max(0, Math.min(100, ((value - min) / range) * 100));

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (
    (criticalLow !== undefined && value < criticalLow) ||
    (criticalHigh !== undefined && value > criticalHigh)
  ) {
    status = 'critical';
  } else if (
    (warningLow !== undefined && value < warningLow) ||
    (warningHigh !== undefined && value > warningHigh)
  ) {
    status = 'warning';
  }

  const statusColor =
    status === 'critical' ? '#D94848' : status === 'warning' ? '#E5A000' : color;

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#718096]">{label}</span>
        <span
          className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', {
            'bg-emerald-50 text-emerald-700': status === 'normal',
            'bg-amber-50 text-amber-700': status === 'warning',
            'bg-red-50 text-red-700': status === 'critical',
          })}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-xl font-semibold" style={{ color: statusColor }}>
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-[#718096]">{unit}</span>
      </div>

      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: statusColor }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-[#A0AEC0]">{min}</span>
        <span className="text-xs text-[#A0AEC0]">{max} {unit}</span>
      </div>
    </div>
  );
}
