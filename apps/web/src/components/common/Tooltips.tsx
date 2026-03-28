import { useState, type ReactNode } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { TooltipsProps as SharedTooltipsProps } from '@meditime/types';

type TooltipsProps = Omit<SharedTooltipsProps, 'children' | 'content'> & {
  children: ReactNode;
  content?: ReactNode;
};

export default function Tooltips({ children, content, side = 'bottom', className = '', propagation = true }: TooltipsProps) {
  const [open, setOpen] = useState(false);
  const isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;

  if (!content) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            className={className || 'inline-block'}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              if (isTouchDevice) {
                if (!propagation) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setOpen(!open);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(!open);
              }
            }}
            onMouseEnter={() => !isTouchDevice && setOpen(true)}
            onMouseLeave={() => !isTouchDevice && setOpen(false)}
            style={{ cursor: 'pointer' }}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align="center"
          sideOffset={5}
          className="bg-popover text-popover-foreground p-2 rounded shadow-sm"
          style={{
            maxWidth: 'min(320px, calc(100vw - 16px))',
            fontSize: '0.85rem',
            zIndex: 1050,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
