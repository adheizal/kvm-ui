import { cn } from '@/lib/utils';
import { Activity, PauseCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface VMStatusBadgeProps {
  status: string;
}

export function VMStatusBadge({ status }: VMStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'running':
        return {
          className: 'bg-success/10 text-success border-success/20',
          icon: Activity,
          label: 'Running'
        };
      case 'stopped':
        return {
          className: 'bg-muted/50 text-muted-foreground border-border',
          icon: PauseCircle,
          label: 'Stopped'
        };
      case 'error':
        return {
          className: 'bg-error/10 text-error border-error/20',
          icon: AlertCircle,
          label: 'Error'
        };
      default:
        return {
          className: 'bg-warning/10 text-warning border-warning/20',
          icon: HelpCircle,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:shadow-md',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {status || config.label}
    </span>
  );
}
