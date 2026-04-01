/* -------------------------------------------------------------------------- */
/* App Navigation Types                                                       */
/* -------------------------------------------------------------------------- */

export interface CalendarLocationList {
  calendar: boolean;
  sharedUserCalendar: boolean;
  tokenCalendar: boolean;
}

export interface ReturnToCalendarList {
  calendar: boolean;
  sharedUserCalendar: boolean;
  addCalendar: boolean;
}

export interface ReturnToCalendarState {
  calendar: boolean;
  sharedUserCalendar: boolean;
  tokenCalendar: boolean;
}