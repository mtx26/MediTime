import type { LucideIcon } from 'lucide-react';
import type { ActionCardProps as SharedActionCardProps } from '@meditime/types';
import { Card, CardContent } from '@/components/ui/card';
import Tooltips from '@/components/common/Tooltips';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionCardProps = SharedActionCardProps<LucideIcon>;

const variantStyles = {
  success: 'border-green-500',
  primary: 'border-primary',
};

const iconStyles = {
  success: 'text-green-500',
  primary: 'text-primary',
};

const ActionCard = ({ variant, icon: Icon, text, onClick, hasTooltip, tooltip, dataTour }: ActionCardProps) => {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className="w-full p-0 border-0 bg-transparent text-left flex-1 cursor-pointer" 
      data-tour={dataTour}
      aria-label={text}
      title={text}
    >
      <Card className={cn('h-full shadow-sm border-2 transition-colors relative', variantStyles[variant])}>
        <CardContent className="flex flex-col justify-center items-center">
          {hasTooltip && (
            <Tooltips content={tooltip} side="bottom" className="absolute top-1 right-1 p-1" propagation={false}>
              <Info className="h-4 w-4 text-blue-500" />
            </Tooltips> 
          )}
          <Icon className={cn('h-10 w-10', iconStyles[variant])} />
          <p className={cn('font-semibold mt-2 mb-0 text-center', iconStyles[variant])}>
            {text}
          </p>
        </CardContent>
      </Card>
    </button>
  );
};

export default ActionCard;
