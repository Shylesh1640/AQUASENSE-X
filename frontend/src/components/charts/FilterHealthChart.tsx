import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FilterHealth } from '../../types';
import { FILTER_LABELS, type FilterComponent } from '../../types';

interface FilterHealthChartProps {
  filters: FilterHealth[];
  height?: number;
}

function getHealthColor(pct: number): string {
  if (pct >= 70) return '#16A36A';
  if (pct >= 40) return '#E5A000';
  return '#D94848';
}

export default function FilterHealthChart({ filters, height = 250 }: FilterHealthChartProps) {
  const chartData = filters.map((f) => ({
    name: FILTER_LABELS[f.component as FilterComponent] || f.component,
    health: Math.round(f.health_pct),
    color: getHealthColor(f.health_pct),
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; health: number } }> }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-[#172B43] mb-1">{item.name}</p>
        <p className="text-sm">
          <span className="text-[#718096]">Health: </span>
          <span className="font-semibold" style={{ color: getHealthColor(item.health) }}>
            {item.health}%
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      <h3 className="text-sm font-medium text-[#172B43] mb-4">Filter Health Status</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#718096' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#718096' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="health" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
