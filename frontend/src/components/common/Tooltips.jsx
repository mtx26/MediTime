import React, { useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function Tooltips({ children, content, side = 'bottom', className = '' }) {
  const [open, setOpen] = useState(false);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (!content) return children;
  
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <span 
            className={className || 'd-inline-block'}
            onClick={(e) => {
              if (isTouchDevice) {
                e.preventDefault();
                e.stopPropagation();
                setOpen(!open);
              }
            }}
            onMouseEnter={() => !isTouchDevice && setOpen(true)}
            onMouseLeave={() => !isTouchDevice && setOpen(false)}
            style={{ cursor: 'pointer' }}
          >
            {children}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align="center"
            sideOffset={5}
            className="bg-dark text-white p-2 rounded shadow-sm"
            style={{
              maxWidth: 'min(320px, calc(100vw - 16px))',
              fontSize: '0.85rem',
              zIndex: 1050,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {content}
            <Tooltip.Arrow className="fill-dark" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
