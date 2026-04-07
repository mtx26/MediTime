import type { ApiFactoryOptions } from '@meditime/types';

export function createNotificationsApi({ apiUrl, uid, showAlert, performApiCall }: ApiFactoryOptions) {
  return {
    readNotification: async (notificationId: string) => {
      return performApiCall({
        url: `${apiUrl}/api/notifications/${notificationId}`,
        method: 'PATCH',
        origin: 'NOTIFICATION_READ',
        uid,
        analyticsEvent: 'read_notification',
        analyticsData: { notificationId, uid },
        showAlert,
      });
    },

    readAllNotifications: async () => {
      return performApiCall({
        url: `${apiUrl}/api/notifications/mark-all-read`,
        method: 'PATCH',
        origin: 'NOTIFICATIONS_MARK_ALL_READ',
        uid,
        analyticsEvent: 'read_all_notifications',
        analyticsData: { uid },
        showAlert,
      });
    },
  };
}
