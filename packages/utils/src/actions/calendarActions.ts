import type {
  ActionItem,
  CalendarActionContext,
  CalendarActionHandlers,
} from '@meditime/types';
import { toISO } from '../date/dateUtils';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function pushSep(actions: ActionItem[]) {
  if (
    actions.length > 0 &&
    !('separator' in actions[actions.length - 1])
  ) {
    actions.push({ separator: true });
  }
}

/* ------------------------------------------------------------------ */
/* Shared calendar actions builder                                    */
/* ------------------------------------------------------------------ */

function buildCalendarActionsBase(
  ctx: CalendarActionContext,
  handlers: Partial<CalendarActionHandlers>,
  exclude: string[],
): ActionItem[] {
  const { calendarId, lng, basePath, selectedDate } = ctx;
  const actions: ActionItem[] = [];

  const add = (a: ActionItem) => {
    if ('separator' in a) {
      pushSep(actions);
      return;
    }
    if (!exclude.includes(a.id)) actions.push(a);
  };

  // ── View toggles ──────────────────────────────────────────────────
  add({
    id: 'pillbox',
    icon: 'grid-3x3',
    labelKey: 'pillbox.title',
    titleKey: 'pillbox.title',
    linkTo: `/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate || new Date())}`,
  });
  add({
    id: 'day_view',
    icon: 'calendar-days',
    labelKey: 'day_view.title',
    titleKey: 'day_view.title',
    linkTo: `/${lng}/${basePath}/${calendarId}/daily?date=${toISO(new Date(new Date().setHours(0, 0, 0, 0)))}`,
  });

  add({ separator: true });

  // ── Calendar management ───────────────────────────────────────────
  if (handlers.onRename) {
    add({
      id: 'rename',
      icon: 'pencil',
      labelKey: 'rename',
      titleKey: 'rename',
      onClick: handlers.onRename,
    });
  }
  add({
    id: 'share',
    icon: 'share-2',
    labelKey: 'share',
    titleKey: 'share',
    linkTo: `/${lng}/shared-calendars?calendar=${calendarId}`,
    dataTour: 'share-calendar-btn',
  });

  add({ separator: true });

  // ── Content actions ───────────────────────────────────────────────
  add({
    id: 'medicines',
    icon: 'pill',
    labelKey: 'medicines.label',
    titleKey: 'medicines.label',
    linkTo: `/${lng}/${basePath}/${calendarId}/boxes`,
  });
  add({
    id: 'export_pdf',
    icon: 'download',
    labelKey: 'boxes.export_pdf',
    titleKey: 'boxes.export_pdf',
    onClick: handlers.onExportPdf,
    dataTour: 'export-pdf-btn',
  });
  add({
    id: 'stock_alerts',
    icon: 'alert-triangle',
    labelKey: 'stock',
    titleKey: 'stock',
    linkTo: `/${lng}/${basePath}/${calendarId}/stock-alerts`,
    dataTour: 'stock-alerts-btn',
  });
  add({
    id: 'ics_calendar',
    icon: 'calendar',
    labelKey: 'ics.calendar_ics',
    titleKey: 'ics.calendar_ics',
    linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
  });
  add({
    id: 'pillbox_history',
    icon: 'clock',
    labelKey: 'pillbox_uses',
    titleKey: 'pillbox_uses',
    linkTo: `/${lng}/${basePath}/${calendarId}/pillbox-uses`,
    dataTour: 'pillbox-history-btn',
  });
  add({
    id: 'missed_intakes',
    icon: 'calendar-off',
    labelKey: 'missed_intakes.title',
    titleKey: 'missed_intakes.title',
    linkTo: `/${lng}/${basePath}/${calendarId}/missed-intakes`,
  });

  add({ separator: true });

  // ── Settings ──────────────────────────────────────────────────────
  add({
    id: 'settings',
    icon: 'settings',
    labelKey: 'settings.label',
    titleKey: 'settings.label',
    linkTo: `/${lng}/${basePath}/${calendarId}/settings`,
    dataTour: 'calendar-settings-btn',
  });

  add({ separator: true });

  // ── Danger zone ───────────────────────────────────────────────────
  add({
    id: 'delete',
    icon: 'trash-2',
    labelKey: 'delete',
    titleKey: 'delete',
    onClick: handlers.onDelete,
    danger: true,
  });

  return actions;
}

/* ------------------------------------------------------------------ */
/* Personal calendar actions (unified)                                */
/* ------------------------------------------------------------------ */

/**
 * Builds the full, unified action list for a **personal** calendar.
 *
 * Pass `exclude` to remove actions that are not relevant in a given
 * view (e.g. exclude `'medicines'` when already on the Boxes page).
 */
export function buildPersonalCalendarActions(
  ctx: CalendarActionContext,
  handlers: CalendarActionHandlers,
  exclude: string[] = [],
): ActionItem[] {
  return buildCalendarActionsBase(ctx, handlers, exclude);
}

/* ------------------------------------------------------------------ */
/* Shared-user calendar actions (unified)                             */
/* ------------------------------------------------------------------ */

/**
 * Builds the full, unified action list for a **shared-user** calendar.
 *
 * Compared to personal: no rename, no share.
 */
export function buildSharedCalendarActions(
  ctx: CalendarActionContext,
  handlers: Omit<CalendarActionHandlers, 'onRename'>,
  exclude: string[] = [],
): ActionItem[] {
  return buildCalendarActionsBase(ctx, handlers, [...exclude, 'share', 'rename']);
}
