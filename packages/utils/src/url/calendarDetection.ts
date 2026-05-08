import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type { CalendarPageSourceType } from '@meditime/types';

export interface CalendarTypeInfo {
  calendarType: CalendarPageSourceType;
  basePath: string;
}

/**
 * Strip the language prefix from a pathname (e.g. "/fr/calendar/123" -> "/calendar/123").
 */
export function stripLangPrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
}

/**
 * Mobile routes keep calendar detail pages under "/calendars/*" while the web
 * keeps them at the root. Normalize both shapes before detecting the source.
 */
export function stripCalendarListPrefix(pathname: string): string {
  const pathWithoutLang = stripLangPrefix(pathname);
  return pathWithoutLang.replace(
    /^\/calendars(?=\/(?:calendar|shared-user-calendar|shared-token-calendar)(?:\/|$))/,
    '',
  ) || '/';
}

/**
 * Detect the calendar type and base path from a pathname.
 */
export function detectCalendarType(pathname: string): CalendarTypeInfo {
  const pathWithoutLang = stripCalendarListPrefix(pathname);

  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
    return { calendarType: 'sharedUser', basePath: 'shared-user-calendar' };
  }
  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_TOKEN)) {
    return { calendarType: 'token', basePath: 'shared-token-calendar' };
  }
  return { calendarType: 'personal', basePath: 'calendar' };
}
