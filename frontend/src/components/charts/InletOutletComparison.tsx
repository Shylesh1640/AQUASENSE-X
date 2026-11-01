import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface ComparisonData {
  parameter: string;
  inlet: number;
  outlet: number;
  unit: string;
}

interface InletOutletComparisonProps {
  data: ComparisonData[];
  height?: number;
}

export default function InletOutletComparison({ data, height = 280 }: InletOutletComparisonProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    const item = data.find((d) => d.parameter === label);
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-[#172B43] mb-1.5">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#718096]">{entry.name}:</span>
            <span className="font-medium text-[#172B43]">
              {entry.value.toFixed(1)} {item?.unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      <h3 className="text-sm font-medium text-[#172B43] mb-4">Inlet vs Outlet Comparison</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="parameter"
            tick={{ fontSize: 12, fill: '#718096' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#718096' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="inlet" name="Inlet" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, idx) => (
              <Cell key={idx} fill="#1677C8" />
            ))}
          </Bar>
          <Bar dataKey="outlet" name="Outlet" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_, idx) => (
              <Cell key={idx} fill="#27B8D5" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
