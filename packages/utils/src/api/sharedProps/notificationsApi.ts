import type { ApiFactoryOptions } from '@meditime/types';

export function createNotificationsApi({ apiUrl, uid, showAlert, performApiCall }: ApiFactoryOptions) {
  return {
    registerPushToken: async (
      token: string,
      options?: {
        deviceName?: string | null;
        platform?: string | null;
        provider?: string | null;
        projectId?: string | null;
      },
    ) => {
      return performApiCall({
        url: `${apiUrl}/api/notifications/push-token`,
        method: 'POST',
        body: {
          token,
          deviceName: options?.deviceName ?? null,
          platform: options?.platform ?? null,
          provider: options?.provider ?? null,
          projectId: options?.projectId ?? null,
        },
        origin: 'PUSH_TOKEN_SEND',
        uid,
        analyticsEvent: 'register_push_token',
        analyticsData: {
          uid,
          deviceName: options?.deviceName ?? null,
          platform: options?.platform ?? null,
          provider: options?.provider ?? null,
          projectId: options?.projectId ?? null,
        },
      });
    },

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
