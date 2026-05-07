import type {
  ActionList,
  NotificationActionContext,
  NotificationActionHandlers,
} from '@meditime/types';

/**
 * Builds the unified action list for the **notifications** page header.
 */
export function buildNotificationActions(
  ctx: NotificationActionContext,
  handlers: NotificationActionHandlers,
): ActionList {
  return [
    [
      {
        id: 'mark_all_read',
        icon: 'bell',
        labelKey: 'notification.mark_all_read',
        titleKey: 'notification.mark_all_read',
        onClick: handlers.onMarkAllRead,
      },
    ],
    { separator: true },
    [
      {
        id: 'settings',
        icon: 'settings',
        labelKey: 'settings.label',
        titleKey: 'settings.label',
        linkTo: `/${ctx.lng}/settings?tab=notifications`,
      },
    ],
  ];
}
