import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { QualityLevel } from '../../types';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: QualityLevel | 'normal' | 'warning' | 'critical' | 'info' | 'inactive';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  lastUpdated?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export function KPICard({
  title,
  value,
  unit,
  status = 'normal',
  trend,
  trendValue,
  subtitle,
  lastUpdated,
  icon,
  onClick,
}: KPICardProps) {
  const colors = statusColors[status] || statusColors.normal;

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-[#E2E8F0] p-5 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-[#718096]">{title}</span>
        {icon && <span className="text-[#718096]">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-semibold text-[#172B43]">
          {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
        </span>
        {unit && <span className="text-sm text-[#718096]">{unit}</span>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              colors.bg,
              colors.text
            )}
          >
            <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>

          {trend && (
            <span
              className={clsx('flex items-center gap-0.5 text-xs', {
                'text-emerald-600': trend === 'down',
                'text-red-600': trend === 'up',
                'text-gray-500': trend === 'stable',
              })}
            >
              {trend === 'up' && <ArrowUp className="w-3 h-3" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3" />}
              {trend === 'stable' && <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
        </div>
      </div>

      {(subtitle || lastUpdated) && (
        <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
          {subtitle && <p className="text-xs text-[#718096]">{subtitle}</p>}
          {lastUpdated && <p className="text-xs text-[#A0AEC0] mt-0.5">{lastUpdated}</p>}
        </div>
      )}
    </div>
  );
}
