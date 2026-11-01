import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import type { SensorType } from '../../types';
import { SENSOR_CONFIG } from '../../types';

interface DataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface SensorTrendChartProps {
  data: DataPoint[];
  sensors: SensorType[];
  height?: number;
  showLegend?: boolean;
  title?: string;
}

export default function SensorTrendChart({
  data,
  sensors,
  height = 300,
  showLegend = true,
  title,
}: SensorTrendChartProps) {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
        <p className="text-xs text-[#718096] mb-1.5">{label ? formatTime(label) : ''}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#718096]">{entry.name}:</span>
            <span className="font-medium text-[#172B43]">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      {title && (
        <h3 className="text-sm font-medium text-[#172B43] mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#718096' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {sensors.map((sensor) => (
            <Line
              key={sensor}
              type="monotone"
              dataKey={sensor}
              name={SENSOR_CONFIG[sensor]?.label || sensor}
              stroke={SENSOR_CONFIG[sensor]?.color || '#1677C8'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
