import { cn, getPriorityColor } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getPriorityColor(priority),
        className
      )}
    >
      {priority}
    </span>
  );
}
