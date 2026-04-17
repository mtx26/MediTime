import type { LucideIcon } from 'lucide-react';
import type { StatusBadgeProps as SharedStatusBadgeProps } from '@meditime/types';
import { Badge } from '@/components/ui/badge';
import Tooltips from '@/components/common/Tooltips';
import { cn } from '@/lib/utils';

type StatusBadgeProps = SharedStatusBadgeProps<LucideIcon>;

const variantMap = {
  warning: 'bg-yellow-500/15 text-foreground border-yellow-500/50',
  danger: 'bg-red-500/15 text-foreground border-red-500/50',
  success: 'bg-green-500/15 text-foreground border-green-500/50',
  secondary: 'bg-secondary/15 text-foreground border-secondary/50',
  info: 'bg-blue-500/15 text-foreground border-blue-500/50',
};

const StatusBadge = ({ variant, icon: Icon, text, tooltip }: StatusBadgeProps) => {
  const content = (
    <Badge variant="outline" className={cn('gap-1', variantMap[variant] || variantMap.secondary)}>
      {Icon && <Icon className="h-3 w-3" />}
      {text}
    </Badge>
  );

  return tooltip ? (
    <Tooltips content={tooltip} side="bottom">
      {content}
    </Tooltips>
  ) : (
    content
  );
};

export default StatusBadge;
