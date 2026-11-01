import type { RecoverySummary } from '../../types';

interface WaterFlowSankeyProps {
  data: RecoverySummary;
}

export default function WaterFlowSankey({ data }: WaterFlowSankeyProps) {
  const totalFeed = data.total_feed_litres || 1;
  const permeatePct = (data.total_permeate_litres / totalFeed) * 100;
  const rejectPct = (data.total_reject_litres / totalFeed) * 100;
  const reusePct = data.total_reject_litres > 0
    ? (data.total_reuse_litres / data.total_reject_litres) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
      <h3 className="text-sm font-medium text-[#172B43] mb-4">Water Flow Distribution</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#718096] w-20 text-right">Feed Water</span>
          <div className="flex-1 h-8 bg-[#1677C8] rounded-md flex items-center px-3">
            <span className="text-xs font-medium text-white">
              {data.total_feed_litres.toFixed(1)} L (100%)
            </span>
          </div>
        </div>

        <div className="flex gap-3 ml-[92px]">
          <svg width="20" height="40" className="text-[#E2E8F0] flex-shrink-0">
            <line x1="10" y1="0" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="18" x2="0" y2="30" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="18" x2="20" y2="30" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#718096] w-20 text-right">Permeate</span>
          <div
            className="h-8 bg-[#27B8D5] rounded-md flex items-center px-3"
            style={{ width: `${Math.max(permeatePct, 10)}%` }}
          >
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {data.total_permeate_litres.toFixed(1)} L ({permeatePct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#718096] w-20 text-right">Reject</span>
          <div
            className="h-8 bg-[#E5A000] rounded-md flex items-center px-3"
            style={{ width: `${Math.max(rejectPct, 10)}%` }}
          >
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {data.total_reject_litres.toFixed(1)} L ({rejectPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#718096] w-20 text-right">Reused</span>
          <div
            className="h-8 bg-[#16A36A] rounded-md flex items-center px-3"
            style={{ width: `${Math.max((data.total_reuse_litres / totalFeed) * 100, 5)}%` }}
          >
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {data.total_reuse_litres.toFixed(1)} L ({reusePct.toFixed(0)}% of reject)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-[#1677C8]">{(data.recovery_ratio * 100).toFixed(1)}%</p>
            <p className="text-xs text-[#718096]">Recovery Ratio</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#16A36A]">{data.reuse_percentage.toFixed(1)}%</p>
            <p className="text-xs text-[#718096]">Reject Reuse</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#27B8D5]">{data.reuse_tank_level.toFixed(1)} L</p>
            <p className="text-xs text-[#718096]">Tank Level / {data.reuse_tank_capacity} L</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-[#A0AEC0] text-center italic">
        Simulated values — reject water is non-potable
      </p>
    </div>
  );
}
