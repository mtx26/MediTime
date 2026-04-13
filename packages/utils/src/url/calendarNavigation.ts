import type {
  CalendarLocationList,
  ReturnToCalendarList,
  ReturnToCalendarState,
} from '@meditime/types';

const CALENDAR_DETAIL_PAGES = [
  'medicines',
  'boxes',
  'pillbox',
  'settings',
  'stock-alerts',
  'daily',
  'pillbox-uses',
  'ics-tokens',
  'missed-intakes',
] as const;

export function buildLocationList(pathWithSlash: string): CalendarLocationList {
  return {
    calendar: pathWithSlash.startsWith('/calendar/'),
    sharedUserCalendar: pathWithSlash.startsWith('/shared-user-calendar/'),
    tokenCalendar: pathWithSlash.startsWith('/shared-token-calendar/'),
  };
}

export function buildReturnToCalendarList(pathParts: string[]): ReturnToCalendarList {
  return {
    calendar: pathParts.length === 2 && pathParts[0] === 'calendar',
    sharedUserCalendar: pathParts.length === 2 && pathParts[0] === 'shared-user-calendar',
    addCalendar: pathParts.length === 1 && pathParts[0] === 'add-calendar',
  };
}

export function buildReturnToCalendar(pathParts: string[]): ReturnToCalendarState {
  const isDetailPage =
    (pathParts.length === 3 || pathParts.length === 4) &&
    CALENDAR_DETAIL_PAGES.includes(pathParts[2] as (typeof CALENDAR_DETAIL_PAGES)[number]);

  return {
    calendar: pathParts[0] === 'calendar' && isDetailPage,
    sharedUserCalendar: pathParts[0] === 'shared-user-calendar' && isDetailPage,
    tokenCalendar: (pathParts.length === 3 || pathParts.length === 4) && pathParts[0] === 'shared-token-calendar',
  };
}

export function isPillboxPath(pathParts: string[]): boolean {
  return (
    pathParts.length === 3
    && ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(pathParts[0])
    && pathParts[2] === 'pillbox'
  );
}