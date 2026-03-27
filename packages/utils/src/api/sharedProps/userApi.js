export function createUserApi({ apiUrl, uid, showAlert, performApiCall }) {
  return {
    fetchNotificationTime: async () => {
      return performApiCall({
        url: `${apiUrl}/api/user/notification-time`,
        method: 'GET',
        origin: 'NOTIFICATION_TIME_FETCH',
        uid,
        analyticsEvent: 'fetch_notification_time',
        analyticsData: { uid },
        showAlert,
      });
    },

    updateNotificationTime: async (notificationTime) => {
      return performApiCall({
        url: `${apiUrl}/api/user/notification-time`,
        method: 'PUT',
        body: { notification_time: notificationTime },
        origin: 'NOTIFICATION_TIME_UPDATE',
        uid,
        analyticsEvent: 'update_notification_time',
        analyticsData: { uid, notificationTime },
        showAlert,
      });
    },
  };
}
