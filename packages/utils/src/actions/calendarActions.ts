import type {
  ActionList,
  CalendarActionContext,
  CalendarActionHandlers,
} from '@meditime/types';
import { toISO } from '../date/dateUtils';

function buildCalendarActionsBase(
  ctx: CalendarActionContext,
  handlers: Partial<CalendarActionHandlers>,
  exclude: string[],
): ActionList {
  const { calendarId, lng, basePath, selectedDate } = ctx;
  const todayIso = toISO(new Date(new Date().setHours(0, 0, 0, 0)));

  const actions: ActionList = [
    [
      {
        id: 'pillbox',
        icon: 'grid-3x3',
        labelKey: 'pillbox.title',
        titleKey: 'pillbox.title',
        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox?date=${toISO(selectedDate || new Date())}`,
      },
      {
        id: 'day_view',
        icon: 'calendar-days',
        labelKey: 'day_view.title',
        titleKey: 'day_view.title',
        linkTo: `/${lng}/${basePath}/${calendarId}/daily?date=${todayIso}`,
      },
    ],
    { separator: true },
    [
      {
        id: 'rename',
        icon: 'pencil',
        labelKey: 'rename',
        titleKey: 'rename',
        onClick: handlers.onRename ?? (() => {}),
      },
      {
        id: 'share',
        icon: 'share-2',
        labelKey: 'share',
        titleKey: 'share',
        linkTo: `/${lng}/shared-calendars?calendar=${calendarId}`,
        dataTour: 'share-calendar-btn',
      },
    ],
    { separator: true },
    [
      {
        id: 'medicines',
        icon: 'pill',
        labelKey: 'medicines.label',
        titleKey: 'medicines.label',
        linkTo: `/${lng}/${basePath}/${calendarId}/boxes`,
      },
      {
        id: 'export_pdf',
        icon: 'download',
        labelKey: 'boxes.export_pdf',
        titleKey: 'boxes.export_pdf',
        onClick: handlers.onExportPdf,
        dataTour: 'export-pdf-btn',
      },
      {
        id: 'stock_alerts',
        icon: 'alert-triangle',
        labelKey: 'stock',
        titleKey: 'stock',
        linkTo: `/${lng}/${basePath}/${calendarId}/stock-alerts`,
        dataTour: 'stock-alerts-btn',
      },
      {
        id: 'ics_calendar',
        icon: 'calendar',
        labelKey: 'ics.calendar_ics',
        titleKey: 'ics.calendar_ics',
        linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
      },
      {
        id: 'pillbox_history',
        icon: 'clock',
        labelKey: 'pillbox_uses',
        titleKey: 'pillbox_uses',
        linkTo: `/${lng}/${basePath}/${calendarId}/pillbox-uses`,
        dataTour: 'pillbox-history-btn',
      },
      {
        id: 'missed_intakes',
        icon: 'calendar-off',
        labelKey: 'missed_intakes.title',
        titleKey: 'missed_intakes.title',
        linkTo: `/${lng}/${basePath}/${calendarId}/missed-intakes`,
      },
    ],
    { separator: true },
    [
      {
        id: 'settings',
        icon: 'settings',
        labelKey: 'settings.label',
        titleKey: 'settings.label',
        linkTo: `/${lng}/${basePath}/${calendarId}/settings`,
        dataTour: 'calendar-settings-btn',
      },
    ],
    { separator: true },
    [
      {
        id: 'delete',
        icon: 'trash-2',
        labelKey: 'delete',
        titleKey: 'delete',
        onClick: handlers.onDelete,
        danger: true,
      },
    ],
  ];

  const visibleActions = actions.reduce<ActionList>((items, item) => {
    if ('separator' in item) {
      if (items.length > 0 && !('separator' in items[items.length - 1])) {
        items.push(item);
      }
      return items;
    }

    const group = item.filter((action) => !exclude.includes(action.id));
    if (group.length > 0) items.push(group);
    return items;
  }, []);

  if (
    visibleActions.length > 0 &&
    'separator' in visibleActions[visibleActions.length - 1]
  ) {
    visibleActions.pop();
  }

  return visibleActions;
}

export function buildPersonalCalendarActions(
  ctx: CalendarActionContext,
  handlers: CalendarActionHandlers,
  exclude: string[] = [],
): ActionList {
  return buildCalendarActionsBase(ctx, handlers, exclude);
}

export function buildSharedCalendarActions(
  ctx: CalendarActionContext,
  handlers: Omit<CalendarActionHandlers, 'onRename'>,
  exclude: string[] = [],
): ActionList {
  return buildCalendarActionsBase(ctx, handlers, [...exclude, 'share', 'rename']);
}
