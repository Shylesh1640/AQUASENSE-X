import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'inactive' | 'active';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const variants: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export function StatusBadge({ variant, label, dot = true, size = 'sm' }: StatusBadgeProps) {
  const v = variants[variant];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        v.bg,
        v.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', v.dot)} />}
      {label}
    </span>
  );
}
