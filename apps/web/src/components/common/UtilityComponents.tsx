import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { IconButtonProps as SharedIconButtonProps } from '@meditime/types';

type IconComponent = ComponentType<{ className?: string }>;
type IconButtonProps = SharedIconButtonProps<IconComponent>;

export default function IconButton({ className, icon: Icon, text, onClick, title, disabled, helpDisabled }: IconButtonProps) {
  const content = (
    <Button
      type="button"
      className={`inline-flex items-center gap-2 ${className || ''}`}
      onClick={onClick}
      aria-label={text}
      title={title || text}
      disabled={disabled}
      variant="outline"
      size="sm"
    >
      {Icon && <Icon className="w-4 h-4" />}
      {text}
    </Button>
  );

  return (disabled && helpDisabled) ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="top">
        {helpDisabled}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );
}
