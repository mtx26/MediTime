import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '@/contexts/AlertContext';
import ActionSheet from '@/components/common/ActionSheet';
import IconButton from '@/components/common/UtilityComponents';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import { buildBoxActions } from '@meditime/utils';
import type { BoxesViewBoxItem, MedicineReviewConditionInput } from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PlusCircle, Package } from 'lucide-react';
import MedicineStatusBadges from './MedicineStatusBadges';
import ConditionsList from './ConditionsList';

interface MedicineCardProps {
  box: BoxesViewBoxItem;
  expandedBoxes: Record<string, boolean>;
  setExpandedBoxes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  calendarId: string | undefined;
  calendarSource: CalendarSourceGroup;
  onEdit: (box: BoxesViewBoxItem) => void;
  onUpdateScan: () => void;
  basePath: string;
  t: (key: string) => string;
}

function MedicineCard({
  box,
  expandedBoxes,
  setExpandedBoxes,
  calendarId,
  calendarSource,
  onEdit,
  onUpdateScan,
  basePath,
  t,
}: MedicineCardProps) {
  const { showConfirm } = useAlert();
  const { lng } = useParams<{ lng?: string }>();
  const navigate = useNavigate();

  const openNotice = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/proxy/pdf/${box.id}`, '_blank');
  };

  const toggleExpand = () => {
    setExpandedBoxes((p) => ({ ...p, [box.id]: !p[box.id] }));
  };

  const deleteBox = async (calId: string, boxId: string) => {
    showConfirm(
      'confirm-danger',
      t('boxes.delete_title'),
      t('boxes.delete_description'),
      async () => {
        await calendarSource.deleteBox!(calId, boxId);
      }
    );
  };

  const getBoxActions = () => toActionSheetItems(
    buildBoxActions({
      onScanQr: onUpdateScan,
      onEdit: () => onEdit(box),
      onViewNotice: openNotice,
      onDelete: () => deleteBox(calendarId!, box.id),
    }),
    t,
  );

  const getBorderClass = () => {
    const allExpired = box.conditions?.every((c: MedicineReviewConditionInput) => {
      if (!c?.max_date) return false;
      return new Date() > new Date(c.max_date);
    });

    if (allExpired) return 'border-blue-500';
    if (box.box_capacity === 0) return '';
    if (box.stock_quantity <= 0) return 'border-destructive';
    if (box.stock_quantity <= box.stock_alert_threshold) return 'border-amber-500';
    return '';
  };

  return (
    <Card className={cn('h-full shadow-sm', getBorderClass())}>
      <CardContent className="relative">

        {/* Action Menu */}
        <div className="absolute top-0 right-2">
          <ActionSheet buttonSize="sm" actions={getBoxActions()} />
        </div>

        {/* Title */}
        <h5 className="font-semibold text-lg mb-2 pr-8">
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
            <p className="font-semibold">{box.stock_quantity}</p>
          </div>
          <div className='flex-1 flex flex-col gap-2'>
            <div className="flex-1">
              <IconButton
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                icon={PlusCircle}
                text={t('boxes.restock')}
                onClick={() => calendarSource.restockBox!(calendarId!, box.id)}
                disabled={box.box_capacity === 0}
                helpDisabled={t('boxes.restock_disabled_tooltip')}
              />
            </div>
            {box.stock_quantity < 0 && (
              <div className='flex-1'>
                <IconButton
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                  icon={Package}
                  text={t('boxes.missing_pillbox')}
                  onClick={() => {
                    const medsIdParam = encodeURIComponent(JSON.stringify([box.id]));
                    navigate(`/${lng}/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <MedicineStatusBadges box={box} onEdit={() => onEdit(box)} t={t} />

        {/* Conditions */}
        <ConditionsList
          conditions={box.conditions}
          expanded={!!expandedBoxes[box.id]}
          onToggle={toggleExpand}
          t={t}
        />
      </CardContent>
    </Card>
  );
}

export default MedicineCard;
