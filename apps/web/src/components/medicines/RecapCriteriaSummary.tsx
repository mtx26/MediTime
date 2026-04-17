import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Pill } from 'lucide-react';
import { TIME_OF_DAY_COLORS } from '@meditime/constants';
import { TIME_ICONS } from '@/hooks/medicines/useMissedIntakes';
import type { MissedIntakesPayload } from '@meditime/types';

interface RecapCriteriaSummaryProps {
  payload: MissedIntakesPayload;
  previewDays: string[];
}

function RecapCriteriaSummary({ payload, previewDays }: RecapCriteriaSummaryProps) {
  const { t } = useTranslation();

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Card className="py-0">
      <CardContent className="px-4 py-3 space-y-3">
        {/* Mode */}
        <div className="flex items-center gap-2 text-sm">
          {payload.mode === 'intake'
            ? <CalendarDays className="size-4 text-muted-foreground" />
            : <Pill className="size-4 text-muted-foreground" />}
          <span className="font-medium">
            {payload.mode === 'intake' ? t('missed_intakes.mode_intake') : t('missed_intakes.mode_medication')}
          </span>
        </div>

        <Separator />

        {/* Days */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {previewDays.length} {t('missed_intakes.days_count')}
          </span>
          <div className="flex flex-wrap gap-1">
            {previewDays.map((day) => (
              <Badge key={day} variant="secondary">{formatDay(day)}</Badge>
            ))}
          </div>
        </div>

        {/* Times (intake mode) */}
        {payload.mode === 'intake' && payload.times && payload.times.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {payload.times.map((time) => {
                const Icon = TIME_ICONS[time];
                return (
                  <Badge key={time} variant="outline" className={`gap-1 ${TIME_OF_DAY_COLORS[time]}`}>
                    {Icon && <Icon className="size-3.5" />}
                    {t(time)}
                  </Badge>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RecapCriteriaSummary;
