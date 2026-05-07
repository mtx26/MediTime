import { performApiCall } from '../apiUtils';
import type { CalendarItem, CalendarsResponse } from '@meditime/types';

export async function fetchCalendars(apiUrl: string): Promise<CalendarItem[]> {
  const result = await performApiCall({
    url: `${apiUrl}/api/calendars`,
    method: 'GET',
    origin: 'CALENDAR_FETCH',
  });

  if (!result.success) return [];

  const data = result as unknown as CalendarsResponse;
  const calendars = data.calendars ?? [];
  return [...calendars].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSharedCalendars(apiUrl: string): Promise<CalendarItem[]> {
  const result = await performApiCall({
    url: `${apiUrl}/api/shared/users/calendars`,
    method: 'GET',
    origin: 'SHARED_CALENDAR_FETCH',
  });

  if (!result.success) return [];

  const data = result as unknown as CalendarsResponse;
  return data.calendars ?? [];
}
