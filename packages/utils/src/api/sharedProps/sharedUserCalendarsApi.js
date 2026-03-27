export function createSharedUserCalendarsApi({ apiUrl, uid, showAlert, performApiCall, toISO }) {
  return {
    sendInvitation: async (email, calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/${calendarId}`,
        method: 'POST',
        body: { email },
        origin: 'INVITATION_SEND',
        uid,
        analyticsEvent: 'send_invitation',
        analyticsData: { email, calendarId, uid },
        showAlert,
      });
    },

    getLoginInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/login/${token}`,
        method: 'GET',
        origin: 'GET_INVITATION_LOGIN',
        uid,
        analyticsEvent: 'get_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    deleteLoginInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/login/${token}`,
        method: 'DELETE',
        origin: 'DELETE_INVITATION_LOGIN',
        uid,
        analyticsEvent: 'delete_shared_user',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    acceptLoginInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/login/accept/${token}`,
        method: 'POST',
        origin: 'ACCEPT_INVITATION_LOGIN',
        uid,
        analyticsEvent: 'accept_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    rejectLoginInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/login/reject/${token}`,
        method: 'POST',
        origin: 'REJECT_INVITATION_LOGIN',
        uid,
        analyticsEvent: 'reject_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    getRegistrationInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/registration/${token}`,
        method: 'GET',
        origin: 'GET_INVITATION_REGISTRATION',
        uid,
        analyticsEvent: 'get_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    deleteRegistrationInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/registration/${token}`,
        method: 'DELETE',
        origin: 'DELETE_INVITATION_REGISTRATION',
        uid,
        analyticsEvent: 'delete_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    acceptRegistrationInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/registration/accept/${token}`,
        method: 'POST',
        origin: 'ACCEPT_INVITATION_REGISTRATION',
        uid,
        analyticsEvent: 'accept_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    rejectRegistrationInvitation: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/invitations/registration/reject/${token}`,
        method: 'POST',
        origin: 'REJECT_INVITATION_REGISTRATION',
        uid,
        analyticsEvent: 'reject_invitation',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    deleteSharedCalendar: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}`,
        method: 'DELETE',
        origin: 'SHARED_CALENDAR_DELETE',
        uid,
        analyticsEvent: 'delete_shared_calendar',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchGroupedSharedCalendars: async () => {
      return performApiCall({
        url: `${apiUrl}/api/shared/grouped`,
        method: 'GET',
        origin: 'SHARED_FETCH',
        uid,
        analyticsEvent: 'fetch_shared_users',
        analyticsData: { uid },
        showAlert,
      });
    },

    fetchSharedUserCalendarSchedule: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());

      const response = await performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'SHARED_CALENDAR_FETCH_SCHEDULE',
        uid,
        analyticsEvent: 'fetch_shared_user_calendar_schedule',
        analyticsData: { calendarId, uid, startDate: start },
        showAlert,
      });

      if (response.success) {
        return {
          ...response,
          calendarName: response.calendar_name,
          ifLowStock: response.if_low_stock ?? false,
        };
      }

      return {
        ...response,
        schedule: [],
        calendarName: '',
        table: {},
      };
    },

    updateSharedUserBox: async (calendarId, boxId, box) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
        method: 'PUT',
        body: { box },
        origin: 'BOX_UPDATE',
        uid,
        analyticsEvent: 'update_shared_user_box',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    createSharedUserBox: async (
      calendarId,
      name,
      boxCapacity,
      stockAlertThreshold,
      stockQuantity,
      dose,
      conditions,
      codeFmd
    ) => {
      const result = await performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/boxes`,
        method: 'POST',
        body: {
          box: {
            name,
            dose,
            box_capacity: boxCapacity,
            stock_alert_threshold: stockAlertThreshold,
            stock_quantity: stockQuantity,
            code_fmd: codeFmd,
            conditions,
          },
        },
        origin: 'BOX_CREATE',
        uid,
        analyticsEvent: 'create_shared_user_box',
        analyticsData: { calendarId, uid },
        showAlert,
      });

      if (result.success) {
        return {
          ...result,
          boxId: result.box_id,
        };
      }

      return result;
    },

    deleteSharedUserBox: async (calendarId, boxId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
        method: 'DELETE',
        origin: 'BOX_DELETE',
        uid,
        analyticsEvent: 'delete_shared_user_box',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchIfSharedUserPillboxUsed: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/pillbox/used?startDate=${start}`,
        method: 'GET',
        origin: 'GET_PILLBOX_USED',
        uid,
        analyticsEvent: 'fetch_if_shared_user_pillbox_used',
        analyticsData: { calendarId, uid, startDate: start },
        showAlert,
      });
    },

    useMedicinesForSharedUserPillbox: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/pillbox/used`,
        method: 'POST',
        body: { startDate: start },
        origin: 'USE_PILLBOX',
        uid,
        analyticsEvent: 'use_shared_user_pillbox_medication',
        analyticsData: { calendarId, startDate: start },
        showAlert,
      });
    },

    cancelUseSharedUserPillbox: async (calendarId, useId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/pillbox/uses/${useId}`,
        method: 'DELETE',
        origin: 'CANCEL_PILLBOX_USE',
        uid,
        analyticsEvent: 'cancel_use_shared_user_pillbox',
        analyticsData: { calendarId, useId, uid },
        showAlert,
      });
    },

    fetchSharedUserPillboxUses: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/pillbox/uses`,
        method: 'GET',
        origin: 'GET_PILLBOX_USES',
        uid,
        analyticsEvent: 'fetch_shared_user_pillbox_uses',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    sharedUserRestockBox: async (calendarId, boxId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/boxes/${boxId}/restock`,
        method: 'POST',
        origin: 'BOX_RESTOCK',
        uid,
        analyticsEvent: 'restock_shared_user_box',
        analyticsData: { calendarId, boxId, uid },
        showAlert,
      });
    },

    fetchSharedUserNotificationsEnabled: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/notifications`,
        method: 'GET',
        origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_FETCH',
        uid,
        analyticsEvent: 'fetch_shared_user_notifications_enabled',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    updateSharedUserNotificationsEnabled: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/notifications`,
        method: 'PATCH',
        origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_UPDATE',
        uid,
        analyticsEvent: 'update_shared_user_notifications_enabled',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchSharedUserStockDecrementMethod: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/stock-decrement-method`,
        method: 'GET',
        origin: 'SHARED_USER_STOCK_DECREMENT_METHOD_FETCH',
        uid,
        analyticsEvent: 'fetch_shared_user_stock_decrement_method',
        showAlert,
        analyticsData: { calendarId, uid },
      });
    },

    fetchSharedUserScheduleNegativeStock: async (calendarId, medsId) => {
      const medsIdParam = encodeURIComponent(JSON.stringify(medsId));
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/schedule/negative-stock?medsId=${medsIdParam}`,
        method: 'GET',
        origin: 'SHARED_USER_SCHEDULE_NEGATIVE_STOCK',
        uid,
        analyticsEvent: 'fetch_shared_user_schedule_negative_stock',
        analyticsData: { calendarId, uid, medsId },
      });
    },

    getSharedTokensIcs: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/ics`,
        method: 'GET',
        origin: 'LIST_SHARED_ICS_TOKENS',
        uid,
        analyticsEvent: 'get_shared_ics_tokens',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    createSharedTokenIcs: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/ics`,
        method: 'POST',
        origin: 'CREATE_SHARED_ICS_TOKEN',
        uid,
        analyticsEvent: 'create_shared_ics_token',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    deleteSharedTokenIcs: async (calendarId, tokenId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/ics/${tokenId}`,
        method: 'DELETE',
        origin: 'DELETE_SHARED_ICS_TOKEN',
        uid,
        analyticsEvent: 'delete_shared_ics_token',
        analyticsData: { calendarId, tokenId, uid },
        showAlert,
      });
    },
  };
}
