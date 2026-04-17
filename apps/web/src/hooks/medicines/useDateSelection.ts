import { useState, useMemo } from 'react';
import type { MissedSelectionMode, DateSelectionCalendarProps } from '@meditime/types';

const expandRange = (from: Date, to: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export function useDateSelection(): DateSelectionCalendarProps {
  const [selectionMode, setSelectionMode] = useState<MissedSelectionMode>('individual');
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);

  const effectiveDays = useMemo(() => {
    if (selectionMode === 'range' && dateRange?.from) {
      return expandRange(dateRange.from, dateRange.to ?? dateRange.from);
    }
    return selectedDays;
  }, [selectionMode, selectedDays, dateRange]);

  return {
    selectionMode,
    onSelectionModeChange: setSelectionMode,
    selectedDays,
    onSelectedDaysChange: setSelectedDays,
    dateRange,
    onDateRangeChange: setDateRange,
    effectiveDays,
  };
}
