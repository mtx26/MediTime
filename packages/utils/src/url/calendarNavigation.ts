import type {
  CalendarLocationList,
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

/**
 * Compute the back-link for the Header based on the current path.
 *
 * Priority:
 *  1. Calendar list pages  (/{type}/{id}, /add-calendar)        → /calendars
 *  2. Sub-detail pages     (/{type}/{id}/{page}/{sub})           → /{type}/{id}/{page}
 *  3. Detail pages         (/{type}/{id}/{page})                 → /{type}/{id}
 *  4. Otherwise                                                  → null (show logo)
 */
export function buildBackLink(
  pathParts: string[],
  lng: string,
  calendarId: string | null,
  basePath: string | null,
  tokenId: string | null,
): string | null {
  const type = pathParts[0];
  const isToken = type === 'shared-token-calendar';

  // 1. Calendar-list level → back to /calendars
  if (
    (pathParts.length === 2 && (type === 'calendar' || type === 'shared-user-calendar')) ||
    (pathParts.length === 1 && type === 'add-calendar')
  ) {
    return `/${lng}/calendars`;
  }

  // Only detail / sub-detail pages below
  const isOnDetailPage =
    (pathParts.length === 3 || pathParts.length === 4) &&
    (isToken || CALENDAR_DETAIL_PAGES.includes(pathParts[2] as (typeof CALENDAR_DETAIL_PAGES)[number]));

  if (!isOnDetailPage) return null;

  // Resolve the base for the calendar
  const id = isToken ? tokenId : calendarId;
  const prefix = isToken ? 'shared-token-calendar' : basePath;
  if (!id || !prefix) return null;

  // 2. Sub-detail (e.g. missed-intakes/recap) → back to detail page
  if (pathParts.length === 4) {
    return `/${lng}/${prefix}/${id}/${pathParts[2]}`;
  }

  // 3. Detail page → back to calendar root
  return `/${lng}/${prefix}/${id}`;
}

export function buildReturnToCalendarList(pathParts: string[]) {
  return {
    calendar: pathParts.length === 2 && pathParts[0] === 'calendar',
    sharedUserCalendar: pathParts.length === 2 && pathParts[0] === 'shared-user-calendar',
    addCalendar: pathParts.length === 1 && pathParts[0] === 'add-calendar',
  };
}

export function buildReturnToCalendar(pathParts: string[]) {
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