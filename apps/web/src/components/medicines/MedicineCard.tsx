import { useTranslation } from 'react-i18next';
import { getBoxDisplayFlags } from '@meditime/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import ActionSheet from '@/components/common/ActionSheet';
import BoxRestockActions from './BoxRestockActions';
import MedicineStatusBadges from './MedicineStatusBadges';
import ConditionsList from './ConditionsList';
import StatusBadge from '@/components/common/StatusBadge';
import type { ReactNode } from 'react';
import type {
  BoxesViewBoxItem,
  CalendarBoxAlertItem,
  ActionSheetAction,
} from '@meditime/types';

interface MedicineCardProps {
  box: BoxesViewBoxItem | CalendarBoxAlertItem;
  onRestock: (id: string) => void;
  onMissingPillbox: (id: string) => void;
  actions?: ActionSheetAction<ReactNode>[];
  onEdit?: () => void;
  expandedBoxes?: Record<string, boolean>;
  setExpandedBoxes?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

function MedicineCard({
  box,
  onRestock,
  onMissingPillbox,
  actions,
  onEdit,
  expandedBoxes,
  setExpandedBoxes,
}: MedicineCardProps) {
  const { t } = useTranslation();
  const isFullMode = !!onEdit;
  const { isCritical, isLow, allExpired } = getBoxDisplayFlags(box);

  const getBorderClass = () => {
    if (isFullMode && allExpired) return 'border-blue-500';
    if (box.box_capacity === 0) return '';
    if (isCritical) return 'border-destructive';
    if (isLow) return 'border-amber-500';
    return '';
  };

  return (
    <Card className={cn('h-full shadow-sm', getBorderClass())}>
      <CardContent className="relative">

        {/* Action Menu (full mode) */}
        {actions && (
          <div className="absolute top-0 right-2">
            <ActionSheet buttonSize="sm" actions={actions} />
          </div>
        )}

        {/* Title */}
        <h5 className={cn('font-semibold text-lg', actions ? 'mb-2 pr-8' : 'mb-4')}>
          {`${box.name}${(box.dose ?? 0) > 0 ? ' (' + box.dose + ' mg)' : ''}`}
        </h5>

        {/* Capacity and Alert Threshold */}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.capacity')}</Label>
            <p className="font-semibold">{box.box_capacity}</p>
          </div>
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.alert_threshold')}</Label>
            <p className="font-semibold">{box.stock_alert_threshold}</p>
          </div>
        </div>

        {/* Stock Quantity and Restock Button */}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.remaining_qty')}</Label>
            <p className={cn('font-semibold', isCritical && 'text-destructive')}>
              {box.stock_quantity}
            </p>
          </div>
          <BoxRestockActions
            boxId={box.id}
            stockQuantity={box.stock_quantity}
            boxCapacity={box.box_capacity}
            onRestock={onRestock}
            onMissingPillbox={onMissingPillbox}
          />
        </div>

        {/* Status Badges */}
        {isFullMode ? (
          <MedicineStatusBadges box={box as BoxesViewBoxItem} onEdit={onEdit!} t={t} />
        ) : (
          <StatusBadge
            variant={isCritical ? 'danger' : 'warning'}
            icon={AlertTriangle}
            text={isCritical ? t('critical_stock') : t('low_stock')}
          />
        )}

        {/* Conditions (full mode) */}
        {isFullMode && expandedBoxes && setExpandedBoxes && (
          <ConditionsList
            conditions={(box as BoxesViewBoxItem).conditions}
            expanded={!!expandedBoxes[box.id]}
            onToggle={() => setExpandedBoxes((p) => ({ ...p, [box.id]: !p[box.id] }))}
            t={t}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default MedicineCard;
