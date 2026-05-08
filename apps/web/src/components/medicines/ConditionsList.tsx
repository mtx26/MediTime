import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { isConditionExpired } from '@meditime/utils';
import StatusBadge from '@/components/common/StatusBadge';
import type { EditableCondition } from '@meditime/types';

interface ConditionsListProps {
  conditions: EditableCondition[];
  expanded: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

const ConditionsList = ({ conditions, expanded, onToggle, t }: ConditionsListProps) => {
  const timeOfDayMap: Record<string, string> = {
    morning: t('morning'),
    noon: t('noon'),
    evening: t('evening'),
  };

  return (
    <div className="mt-4">
      <div className="border-t border-border pt-2">
        <button
          className="w-full flex justify-between items-center py-2 bg-transparent border-0 cursor-pointer"
          type="button"
          title={t('boxes.intake_conditions')}
          onClick={onToggle}
          data-tour="box-condition-toggle"
        >
          <span className="font-medium">{t('boxes.intake_conditions')}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {conditions.filter((c) => c !== undefined).length > 0 ? (
            conditions
              .filter((c) => c !== undefined)
              .map((cond) => (
                <div
                  key={cond.id}
                  className="p-3 border rounded-md bg-muted/50"
                >
                  <p className="mb-1">
                    <strong>{cond.tablet_count}</strong>{' '}
                    {Number(cond.tablet_count) > 1 ? t('boxes.tablets') : t('boxes.tablet')}{' '}
                    {t('boxes.every')}{' '}
                    <strong>{cond.interval_days}</strong>{' '}
                    {Number(cond.interval_days) > 1 ? t('boxes.days') : t('boxes.day')}{' '}
                    {t('boxes.each')}{' '}
                    <strong>{timeOfDayMap[cond.time_of_day ?? '']}</strong>
                  </p>
                  {Number(cond.interval_days) > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {t('boxes.from')} {new Date(cond.start_date!).toLocaleDateString()}
                    </p>
                  )}
                  {cond.max_date && (
                    <p className="text-sm text-muted-foreground">
                      {t('boxes.until')} {new Date(cond.max_date).toLocaleDateString()}
                    </p>
                  )}
                  {isConditionExpired(cond) && (
                    <div className="mt-2">
                      <StatusBadge
                        variant="info"
                        icon={AlertCircle}
                        text={t('boxes.condition.expired')}
                        tooltip={t('boxes.condition.expired_tooltip_one')}
                      />
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="border rounded-md bg-muted/50 p-3">
              <p className="text-muted-foreground text-sm">
                {t('boxes.condition.none')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConditionsList;
