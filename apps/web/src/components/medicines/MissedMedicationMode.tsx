import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DateSelectionCalendar from '@/components/medicines/DateSelectionCalendar';
import { useDateSelection } from '@/hooks/medicines/useDateSelection';
import { TIME_OF_DAY_COLORS } from '@meditime/constants';
import { TIME_ICONS, getBoxTimes, toDateKey } from '@/hooks/medicines/useMissedIntakes';
import type { BoxItem } from '@meditime/types';

interface MissedMedicationModeProps {
  activeBoxes: BoxItem[];
}

function MissedMedicationMode({ activeBoxes }: MissedMedicationModeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const calendar = useDateSelection();

  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);

  const isValid = calendar.effectiveDays.length > 0 && selectedMedIds.length > 0;

  const handleNext = () => {
    const days = calendar.effectiveDays.map((d) => toDateKey(d));
    navigate('recap', { state: { payload: { mode: 'medication' as const, days, med_ids: selectedMedIds } } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_medication')}</h5>
        <div className="space-y-1.5">
          {activeBoxes.map((box) => {
            const selected = selectedMedIds.includes(box.id);
            const boxTimes = getBoxTimes(box);
            return (
              <Card
                key={box.id}
                className={`cursor-pointer transition-colors py-0 ${selected ? 'border-primary' : ''}`}
                onClick={() => setSelectedMedIds((prev) => selected ? prev.filter((id) => id !== box.id) : [...prev, box.id])}
              >
                <CardContent className="flex items-center gap-3 px-4 py-2">
                  <Checkbox checked={selected} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{box.name}{box.dose ? ` (${box.dose} mg)` : ''}</span>
                      <span className="text-muted-foreground text-xs">{t('missed_intakes.stock')}: {box.stock_quantity}</span>
                    </div>
                    {boxTimes.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {boxTimes.map((time) => {
                          const Icon = TIME_ICONS[time];
                          return (
                            <Badge key={time} variant="outline" className={`text-xs py-0 gap-1 ${TIME_OF_DAY_COLORS[time]}`}>
                              <Icon className="size-3" />
                              {t(time)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedMedIds.length > 0 && (
        <div>
          <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_period')}</h5>
          <DateSelectionCalendar {...calendar} />
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

export default MissedMedicationMode;
