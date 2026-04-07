import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { toISO } from '@meditime/utils';
import type { WeeklyEventItem } from '@meditime/types';

export function useFilteredEventsForDay(
  selectedDate: Date | null,
  calendarEvents: WeeklyEventItem[],
  setEventsForDay: Dispatch<SetStateAction<WeeklyEventItem[]>>,
) {
  useEffect(() => {
    if (!selectedDate || !calendarEvents.length) return;
    const sortedEvents = [...calendarEvents].sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      if (dateA.getTime() === dateB.getTime()) {
        return a.title.localeCompare(b.title);
      }
      return dateA.getTime() - dateB.getTime();
    });
    const filtered = sortedEvents.filter((event) =>
      event.start.startsWith(toISO(selectedDate))
    );
    setEventsForDay(filtered);
  }, [selectedDate, calendarEvents, setEventsForDay]);
}

export function useCalendarDayNavigation(
  selectedDate: Date | null,
  setSelectedDate: Dispatch<SetStateAction<Date | null>>,
  onWeekSelect: (date: Date) => void,
) {
  const navigateDay = useCallback(
    (direction: number) => {
      if (!selectedDate) return;
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + direction);
      setSelectedDate(current);
    },
    [selectedDate, setSelectedDate],
  );

  const navigateWeek = useCallback(
    (direction: number) => {
      if (!selectedDate) return;
      const current = new Date(selectedDate);
      current.setDate(current.getDate() + direction);
      onWeekSelect(current);
    },
    [selectedDate, onWeekSelect],
  );

  return { navigateDay, navigateWeek };
}
