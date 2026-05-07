import type { BoxesViewBoxItem } from '@meditime/types';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  AlertCircle,
  BellOff,
  Info,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getBoxStatusItems, type BoxStatusItemKey } from '@meditime/utils';

interface MedicineStatusBadgesProps {
  box: BoxesViewBoxItem;
  onEdit: () => void;
  t: (key: string) => string;
}

const ICON_MAP: Record<BoxStatusItemKey, LucideIcon> = {
  condition_none: Info,
  condition_inactive: PauseCircle,
  condition_expired: AlertCircle,
  stock_out: AlertTriangle,
  stock_low: AlertTriangle,
  stock_ok: CheckCircle,
  alerts_disabled: BellOff,
};

const TOOLTIP_I18N_MAP: Record<BoxStatusItemKey, string> = {
  condition_none: 'boxes.condition_none_tooltip',
  condition_inactive: 'boxes.condition.inactive_tooltip',
  condition_expired: 'boxes.condition.expired_tooltip',
  stock_out: 'boxes.stock.badge.tooltip.out',
  stock_low: 'boxes.stock.badge.tooltip.low',
  stock_ok: 'boxes.stock.badge.tooltip.high',
  alerts_disabled: 'boxes.stock.badge.tooltip.alerts_disabled',
};

const MedicineStatusBadges = ({ box, onEdit, t }: MedicineStatusBadgesProps) => {
  const items = getBoxStatusItems(box);

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {items.map((item) => {
        const badge = (
          <StatusBadge
            variant={item.variant}
            icon={ICON_MAP[item.key]}
            text={t(item.i18nKey)}
            tooltip={t(TOOLTIP_I18N_MAP[item.key])}
          />
        );

        if (item.key === 'condition_none') {
          return (
            <button
              key={item.key}
              className="p-0 border-0 bg-transparent"
              onClick={onEdit}
              aria-label={t('boxes.condition.add')}
            >
              {badge}
            </button>
          );
        }

        return (
          <span key={item.key}>
            {badge}
          </span>
        );
      })}
    </div>
  );
};

export default MedicineStatusBadges;
