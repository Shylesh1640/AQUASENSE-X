import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-[#CBD5E0] mb-4">
        {icon || <Inbox className="w-12 h-12" />}
      </div>
      <h3 className="text-lg font-medium text-[#172B43] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#718096] max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}
