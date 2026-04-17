import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import DateSelectionCalendar from '@/components/medicines/DateSelectionCalendar';
import { useDateSelection } from '@/hooks/medicines/useDateSelection';
import { ALL_TIMES, TIME_OF_DAY_COLORS } from '@meditime/constants';
import { TIME_ICONS, toDateKey, formatDay } from '@/hooks/medicines/useMissedIntakes';
import type { TimeOfDay } from '@meditime/types';

function MissedIntakeMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const calendar = useDateSelection();

  const [selectedTimes, setSelectedTimes] = useState<TimeOfDay[]>([]);
  const [customPerDay, setCustomPerDay] = useState(false);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, TimeOfDay[]>>({});

  const hasTimesSelected = customPerDay
    ? Object.values(perDayTimes).some((times) => times.length > 0)
    : selectedTimes.length > 0;

  const isValid = calendar.effectiveDays.length > 0 && hasTimesSelected;

  const handleNext = () => {
    const days = calendar.effectiveDays.map((d) => toDateKey(d));
    const payload = customPerDay
      ? { mode: 'intake' as const, days, per_day_times: perDayTimes }
      : { mode: 'intake' as const, days, times: selectedTimes };
    navigate('recap', { state: { payload } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_days')}</h5>
        <DateSelectionCalendar {...calendar} />
      </div>

      {calendar.effectiveDays.length > 0 && (
        <div>
          <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_times')}</h5>

          {!customPerDay && (
            <ToggleGroup type="multiple" variant="outline" value={selectedTimes} onValueChange={(v) => setSelectedTimes(v as TimeOfDay[])}>
              {ALL_TIMES.map((time) => {
                const Icon = TIME_ICONS[time];
                return (
                  <ToggleGroupItem key={time} value={time} className={`gap-1.5 px-4 ${selectedTimes.includes(time) ? TIME_OF_DAY_COLORS[time] : ''}`}>
                    <Icon className="size-4" />
                    {t(time)}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Checkbox
              id="custom-per-day"
              checked={customPerDay}
              onCheckedChange={(v) => setCustomPerDay(!!v)}
            />
            <Label htmlFor="custom-per-day" className="text-sm cursor-pointer">
              {t('missed_intakes.customize_per_day')}
            </Label>
          </div>

          {customPerDay && (
            <div className="space-y-2 mt-3">
              {calendar.effectiveDays.sort((a, b) => a.getTime() - b.getTime()).map((day) => {
                const dayKey = toDateKey(day);
                const dayTimes = perDayTimes[dayKey] ?? [];
                return (
                  <Card key={dayKey} className="py-0">
                    <CardContent className="flex items-center gap-3 px-3 py-1.5 flex-wrap">
                      <span className="text-sm font-medium min-w-17.5">{formatDay(day)}</span>
                      <ToggleGroup type="multiple" variant="outline" size="sm" value={dayTimes} onValueChange={(v) => setPerDayTimes((p) => ({ ...p, [dayKey]: v as TimeOfDay[] }))}>
                        {ALL_TIMES.map((time) => {
                          const Icon = TIME_ICONS[time];
                          return (
                            <ToggleGroupItem key={time} value={time} className={`gap-1 px-2.5 ${dayTimes.includes(time) ? TIME_OF_DAY_COLORS[time] : ''}`}>
                              <Icon className="size-3.5" />
                              {t(time)}
                            </ToggleGroupItem>
                          );
                        })}
                      </ToggleGroup>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isValid && (
        <div className="border-t pt-3 flex items-center justify-end">
          <Button onClick={handleNext}>
            {t('missed_intakes.next')}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default MissedIntakeMode;
