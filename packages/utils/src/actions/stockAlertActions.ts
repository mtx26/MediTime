import type {
  ActionList,
  StockAlertActionContext,
  StockAlertActionHandlers,
} from '@meditime/types';

/**
 * Builds the unified action list for the **stock alerts** page header.
 */
export function buildStockAlertActions(
  ctx: StockAlertActionContext,
  handlers: StockAlertActionHandlers,
): ActionList {
  return [
    [
      {
        id: 'send_sms',
        icon: 'message-square',
        labelKey: 'send_sms',
        titleKey: 'send_sms',
        onClick: handlers.onSendSms,
        dataTour: 'send-sms-btn',
      },
      {
        id: 'ics_calendar',
        icon: 'calendar',
        labelKey: 'ics.calendar_ics',
        titleKey: 'ics.calendar_ics',
        linkTo: `/${ctx.lng}/${ctx.basePath}/${ctx.calendarId}/ics-tokens`,
        dataTour: 'ics-calendar-btn',
      },
    ],
  ];
}
