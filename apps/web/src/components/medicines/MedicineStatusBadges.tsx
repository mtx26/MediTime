import type { BoxesViewBoxItem, MedicineReviewConditionInput } from '@meditime/types';
import {
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  AlertCircle,
  BellOff,
  Info,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

interface MedicineStatusBadgesProps {
  box: BoxesViewBoxItem;
  onEdit: () => void;
  t: (key: string) => string;
}

const MedicineStatusBadges = ({ box, onEdit, t }: MedicineStatusBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {box.conditions.filter((c: MedicineReviewConditionInput) => c !== undefined).length === 0 && (
        <button
          className="p-0 border-0 bg-transparent"
          onClick={onEdit}
          aria-label={t('boxes.condition.add')}
        >
          <StatusBadge
            variant="warning"
            icon={Info}
            text={t('boxes.condition.none')}
            tooltip={t('boxes.condition_none_tooltip')}
          />
        </button>
      )}

      {box.conditions?.every((c: MedicineReviewConditionInput) => {
        if (!c?.max_date) return false;
        return new Date() > new Date(c.max_date);
      }) ? (
        <StatusBadge
          variant="info"
          icon={PauseCircle}
          text={t('boxes.condition.inactive')}
          tooltip={t('boxes.condition.inactive_tooltip')}
        />
      ) : (
        box.conditions?.some((c: MedicineReviewConditionInput) => {
          if (!c?.max_date) return false;
          return new Date() > new Date(c.max_date);
        }) ? (
          <StatusBadge
            variant="info"
            icon={AlertCircle}
            text={t('boxes.condition.expired')}
            tooltip={t('boxes.condition.expired_tooltip')}
          />
        ) : (
          <>
            {box.box_capacity !== 0 && (
              <StatusBadge
                variant={
                  box.stock_quantity <= 0
                    ? 'danger'
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? 'warning'
                    : 'success'
                }
                icon={
                  box.stock_quantity <= 0
                    ? AlertTriangle
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? AlertTriangle
                    : CheckCircle
                }
                text={
                  box.stock_quantity <= 0
                    ? t('boxes.stock.badge.out')
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? t('boxes.stock.badge.low')
                    : t('boxes.stock.badge.high')
                }
                tooltip={
                  box.stock_quantity <= 0
                    ? t('boxes.stock.badge.tooltip.out')
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? t('boxes.stock.badge.tooltip.low')
                    : t('boxes.stock.badge.tooltip.high')
                }
              />
            )}
          </>
        )
      )}

      {(box.box_capacity <= 0 || box.stock_alert_threshold <= 0) && (
        <StatusBadge
          variant="info"
          icon={BellOff}
          text={t('boxes.stock.badge.alerts_disabled')}
          tooltip={t('boxes.stock.badge.tooltip.alerts_disabled')}
        />
      )}
    </div>
  );
};

export default MedicineStatusBadges;
