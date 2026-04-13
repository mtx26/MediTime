import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, CalendarRange } from 'lucide-react';
import type { DateSelectionCalendarProps, MissedSelectionMode } from '@meditime/types';

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export default function DateSelectionCalendar({
  selectionMode,
  onSelectionModeChange,
  selectedDays,
  onSelectedDaysChange,
  dateRange,
  onDateRangeChange,
  effectiveDays,
}: DateSelectionCalendarProps) {
  const { t } = useTranslation();

  return (
    <div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={selectionMode}
        onValueChange={(v) => {
          if (v) {
            onSelectionModeChange(v as MissedSelectionMode);
            onSelectedDaysChange([]);
            onDateRangeChange(undefined);
          }
        }}
        className="mb-2"
      >
        <ToggleGroupItem value="individual" className="gap-1.5 px-3">
          <CalendarDays className="size-3.5" />
          {t('missed_intakes.selection_individual')}
        </ToggleGroupItem>
        <ToggleGroupItem value="range" className="gap-1.5 px-3">
          <CalendarRange className="size-3.5" />
          {t('missed_intakes.selection_range')}
        </ToggleGroupItem>
      </ToggleGroup>

      <Card className="py-0">
        <CardContent className="flex justify-center px-2 py-1">
          {selectionMode === 'individual' ? (
            <Calendar
              mode="multiple"
              selected={selectedDays}
              onSelect={(days) => onSelectedDaysChange(days ?? [])}
              disabled={{ after: new Date() }}
            />
          ) : (
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              disabled={{ after: new Date() }}
            />
          )}
        </CardContent>
      </Card>
      {effectiveDays.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {effectiveDays
            .sort((a, b) => a.getTime() - b.getTime())
            .map((d) => (
              <Badge key={toDateKey(d)} variant="secondary">
                {formatDay(d)}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}
