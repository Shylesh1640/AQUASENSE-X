import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Droplets, TrendingUp, Gauge, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { api } from '../services/api';
import { KPICard } from '../components/common/KPICard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const RORecovery: React.FC = () => {
  const { data: recoverySummary, isLoading } = useQuery({
    queryKey: ['recovery-summary'],
    queryFn: () => api.get('/recovery/summary'),
    refetchInterval: 2000
  });

  const { data: recoveryHistory } = useQuery({
    queryKey: ['recovery-history'],
    queryFn: () => api.get('/recovery/history'),
    refetchInterval: 5000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!recoverySummary) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-red-500" />}
        title="No recovery data available"
        description="Start the simulation to see RO recovery statistics"
      />
    );
  }

  const {
    total_feed,
    total_permeate,
    total_reject,
    total_reuse,
    recovery_ratio,
    reuse_percentage,
    reuse_tank_level,
    reuse_tank_capacity
  } = recoverySummary;

  const permeatePercent = total_feed > 0 ? (total_permeate / total_feed) * 100 : 0;
  const rejectPercent = total_feed > 0 ? (total_reject / total_feed) * 100 : 0;
  const reuseOfReject = total_reject > 0 ? (total_reuse / total_reject) * 100 : 0;
  const dischargePercent = 100 - reuseOfReject;
  const tankFillPercent = reuse_tank_capacity > 0 ? (reuse_tank_level / reuse_tank_capacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101D2D]">RO Recovery</h1>
        <p className="text-sm text-[#718096] mt-1">Reject water recovery and reuse monitoring</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Water Processed"
          value={`${total_feed.toFixed(1)} L`}
          icon={<Droplets className="w-5 h-5" />}
          trend={total_feed > 0 ? 'up' : 'neutral'}
          trendValue=""
          status="info"
        />
        <KPICard
          title="Purified Water"
          value={`${total_permeate.toFixed(1)} L`}
          subtitle={`${permeatePercent.toFixed(1)}% of feed`}
          icon={<Droplets className="w-5 h-5" />}
          trend="neutral"
          status="success"
        />
        <KPICard
          title="Reject Water"
          value={`${total_reject.toFixed(1)} L`}
          subtitle={`${rejectPercent.toFixed(1)}% of feed`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="neutral"
          status="warning"
        />
        <KPICard
          title="Water Recovered"
          value={`${total_reuse.toFixed(1)} L`}
          subtitle={`${reuseOfReject.toFixed(1)}% of reject`}
          icon={<Droplets className="w-5 h-5" />}
          trend={total_reuse > 0 ? 'up' : 'neutral'}
          status="success"
        />
      </div>

      {/* Water Flow Diagram */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="font-semibold text-[#101D2D] mb-6">Water Flow Diagram</h2>

        <div className="space-y-8">
          {/* Feed Water */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-32 text-right">
              <span className="text-sm font-semibold text-[#101D2D]">FEED WATER</span>
              <div className="text-xs text-[#718096]">100%</div>
            </div>
            <div className="flex-1">
              <div className="h-8 bg-[#1677C8] rounded-lg shadow-sm flex items-center justify-center">
                <span className="text-white font-medium text-sm">{total_feed.toFixed(1)} L</span>
              </div>
            </div>
          </div>

          {/* RO Treatment */}
          <div className="flex items-center gap-3 pl-8">
            <div className="flex-shrink-0 w-24 text-right">
              <span className="text-xs text-[#718096]">RO Membrane</span>
            </div>
            <div className="flex-1 border-l-2 border-[#718096] pl-4">
              {/* Permeate Flow */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-[#16A36A]">PERMEATE (Purified)</span>
                  <span className="text-xs text-[#718096]">{permeatePercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 bg-[#16A36A] rounded shadow-sm flex items-center justify-center"
                    style={{ width: `${permeatePercent}%` }}
                  >
                    {permeatePercent > 20 && (
                      <span className="text-white text-xs font-medium">{total_permeate.toFixed(1)} L</span>
                    )}
                  </div>
                  <span className="text-xs text-[#718096]">→ Storage Tank</span>
                </div>
              </div>

              {/* Reject Flow */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-[#E5A000]">REJECT</span>
                  <span className="text-xs text-[#718096]">{rejectPercent.toFixed(1)}%</span>
                </div>
                <div
                  className="h-6 bg-[#E5A000] rounded shadow-sm flex items-center justify-center mb-2"
                  style={{ width: `${rejectPercent}%` }}
                >
                  {rejectPercent > 20 && (
                    <span className="text-white text-xs font-medium">{total_reject.toFixed(1)} L</span>
                  )}
                </div>

                {/* Reject Splitting */}
                <div className="pl-8 space-y-2">
                  {/* Reuse */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#27B8D5]">Reuse (Non-Potable)</span>
                      <span className="text-xs text-[#718096]">{reuseOfReject.toFixed(1)}%</span>
                    </div>
                    <div
                      className="h-4 bg-[#27B8D5] rounded shadow-sm flex items-center justify-center"
                      style={{ width: `${reuseOfReject * 0.6}%` }}
                    >
                      {reuseOfReject > 20 && (
                        <span className="text-white text-xs">{total_reuse.toFixed(1)} L</span>
                      )}
                    </div>
                  </div>

                  {/* Discharge */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#718096]">Discharge</span>
                      <span className="text-xs text-[#718096]">{dischargePercent.toFixed(1)}%</span>
                    </div>
                    <div
                      className="h-4 bg-gray-400 rounded shadow-sm flex items-center justify-center"
                      style={{ width: `${dischargePercent * 0.6}%` }}
                    >
                      {dischargePercent > 20 && (
                        <span className="text-white text-xs">{(total_reject - total_reuse).toFixed(1)} L</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Recovery calculations are simulated. Actual recovery depends on physical system configuration, membrane efficiency, and inlet water quality.
          </p>
        </div>
      </div>

      {/* Recovery Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recovery Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[#101D2D] mb-4">Recovery Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#718096]">Recovery Ratio</span>
                <span className="text-lg font-bold text-[#1677C8]">{(recovery_ratio * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#1677C8] h-2 rounded-full transition-all"
                  style={{ width: `${recovery_ratio * 100}%` }}
                />
              </div>
              <p className="text-xs text-[#718096] mt-1">Permeate / Feed ratio</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#718096]">Reuse Percentage</span>
                <span className="text-lg font-bold text-[#27B8D5]">{reuseOfReject.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#27B8D5] h-2 rounded-full transition-all"
                  style={{ width: `${reuseOfReject}%` }}
                />
              </div>
              <p className="text-xs text-[#718096] mt-1">Reuse / Reject ratio</p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0]">
              <div className="flex justify-between text-sm">
                <span className="text-[#718096]">Total Water Savings</span>
                <span className="font-semibold text-[#16A36A]">{total_reuse.toFixed(1)} L</span>
              </div>
              <p className="text-xs text-[#718096] mt-1">
                Water recovered for non-potable reuse (gardening, cleaning, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Reuse Tank Level */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-[#1677C8]" />
            <h3 className="font-semibold text-[#101D2D]">Reuse Tank Status</h3>
          </div>

          <div className="flex items-end justify-center h-48 mb-4">
            <div className="relative w-32 h-full border-2 border-[#718096] rounded-lg overflow-hidden bg-gray-50">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#27B8D5] to-[#1677C8] transition-all"
                style={{ height: `${Math.min(tankFillPercent, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#101D2D]">{tankFillPercent.toFixed(0)}%</div>
                  <div className="text-xs text-[#718096]">Fill Level</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#718096]">Current Level:</span>
              <span className="font-medium">{reuse_tank_level.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Capacity:</span>
              <span className="font-medium">{reuse_tank_capacity.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Available Space:</span>
              <span className="font-medium">{(reuse_tank_capacity - reuse_tank_level).toFixed(1)} L</span>
            </div>
          </div>

          {tankFillPercent > 90 && (
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">Tank is nearly full. Consider utilizing stored water.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recovery Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#101D2D] mb-4">Recovery Trend Over Time</h3>

        {recoveryHistory && recoveryHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={recoveryHistory}>
              <defs>
                <linearGradient id="colorPermeate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A36A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#16A36A" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5A000" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#E5A000" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorReuse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27B8D5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#27B8D5" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => format(parseISO(val), 'HH:mm')}
                stroke="#718096"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#718096"
                style={{ fontSize: '12px' }}
                label={{ value: 'Volume (L)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px'
                }}
                labelFormatter={(val) => format(parseISO(val), 'PPp')}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="permeate_volume"
                stackId="1"
                stroke="#16A36A"
                fillOpacity={1}
                fill="url(#colorPermeate)"
                name="Permeate"
              />
              <Area
                type="monotone"
                dataKey="reuse_volume"
                stackId="1"
                stroke="#27B8D5"
                fillOpacity={1}
                fill="url(#colorReuse)"
                name="Reuse"
              />
              <Area
                type="monotone"
                dataKey="reject_volume"
                stackId="1"
                stroke="#E5A000"
                fillOpacity={1}
                fill="url(#colorReject)"
                name="Reject (Discharged)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-[#718096]">
              No historical recovery data available yet. Run the simulation to collect trend data.
            </p>
          </div>
        )}
      </div>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <Droplets className="w-6 h-6 text-[#16A36A] flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-[#101D2D] mb-2">Environmental Impact</h3>
            <p className="text-sm text-[#718096] mb-3">
              By recovering {total_reuse.toFixed(1)} litres of reject water for non-potable reuse, this system reduces water waste and contributes to sustainable water management.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#718096]">Water Recovered:</span>
                <span className="ml-2 font-semibold text-[#16A36A]">{total_reuse.toFixed(1)} L</span>
              </div>
              <div>
                <span className="text-[#718096]">Reuse Target:</span>
                <span className="ml-2 font-semibold text-[#1677C8]">≥50% of reject</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
