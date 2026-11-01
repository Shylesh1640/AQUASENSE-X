import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  timestamp: string;
  litres: number;
}

interface ConsumptionChartProps {
  data: DataPoint[];
  height?: number;
  title?: string;
}

export default function ConsumptionChart({
  data,
  height = 250,
  title = 'Water Consumption',
}: ConsumptionChartProps) {
  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), 'HH:mm');
    } catch {
      return ts;
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
        <p className="text-xs text-[#718096] mb-1">{label ? formatTime(label) : ''}</p>
        <p className="text-sm font-medium text-[#172B43]">
          {payload[0].value.toFixed(2)} L
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      {title && <h3 className="text-sm font-medium text-[#172B43] mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#27B8D5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#27B8D5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: '#718096' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#718096' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            unit=" L"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="litres"
            stroke="#27B8D5"
            strokeWidth={2}
            fill="url(#consumptionGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
