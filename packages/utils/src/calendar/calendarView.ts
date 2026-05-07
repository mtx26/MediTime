import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import type { CalendarTable, DateLike, WeeklyEventItem } from '@meditime/types';
import { getWeekDates, normalizeToStartOfDay, toISO } from '../date/dateUtils';

export function calendarTableHasItems(calendarTable: CalendarTable): boolean {
  return Object.values(calendarTable).some((items) => items.length > 0);
}

export function filterEventsForDate(events: WeeklyEventItem[], dateInput: DateLike): WeeklyEventItem[] {
  const isoDate = toISO(dateInput);
  return events.filter((event) => event.start.startsWith(isoDate));
}

export function getInitialSelectedDateForStockMethod(method: string | null | undefined, now = new Date()): Date {
  if (method === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX) {
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    nextWeek.setHours(0, 0, 0, 0);
    return nextWeek;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getWeekSelectionState(selectedDateInput: DateLike | null | undefined) {
  const selectedDate = selectedDateInput
    ? normalizeToStartOfDay(selectedDateInput)
    : normalizeToStartOfDay(new Date());
  const weekDates = getWeekDates(selectedDate);
  const selectedIso = toISO(selectedDate);
  const weekIsos = weekDates.map(toISO);

  return {
    selectedDate,
    weekDates,
    isFirstDay: weekIsos[0] === selectedIso,
    isLastDay: weekIsos[6] === selectedIso,
  };
}
