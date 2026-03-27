export function createPersonalCalendarsApi({ apiUrl, uid, showAlert, performApiCall, toISO }) {
  return {
    addCalendar: async (calendarName) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars`,
        method: 'POST',
        body: { calendarName },
        origin: 'CALENDAR_CREATE',
        uid,
        analyticsEvent: 'add_calendar',
        analyticsData: { calendarName, uid },
        showAlert,
      });
    },

    deleteCalendar: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}`,
        method: 'DELETE',
        origin: 'CALENDAR_DELETE',
        uid,
        analyticsEvent: 'delete_calendar',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    renameCalendar: async (calendarId, newCalendarName) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}`,
        method: 'PUT',
        body: { newCalendarName },
        origin: 'CALENDAR_RENAME',
        uid,
        analyticsEvent: 'rename_calendar',
        analyticsData: { calendarId, newCalendarName, uid },
        showAlert,
      });
    },

    fetchPersonalCalendarSchedule: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());

      const result = await performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'CALENDAR_FETCH_SCHEDULE',
        uid,
        analyticsEvent: 'fetch_personal_calendar_schedule',
        analyticsData: { calendarId, uid, startDate: start },
      });

      if (result.success) {
        return {
          ...result,
          calendarName: result.calendar_name,
          ifLowStock: result.if_low_stock,
        };
      }

      return {
        ...result,
        schedule: [],
        calendarName: '',
        table: {},
      };
    },

    updatePersonalBox: async (calendarId, boxId, box) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/boxes/${boxId}`,
        method: 'PUT',
        body: { box },
        origin: 'BOX_UPDATE',
        uid,
        analyticsEvent: 'update_personal_box',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    createPersonalBox: async (
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
        url: `${apiUrl}/api/calendars/${calendarId}/boxes`,
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
        analyticsEvent: 'create_personal_box',
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

    deletePersonalBox: async (calendarId, boxId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/boxes/${boxId}`,
        method: 'DELETE',
        origin: 'BOX_DELETE',
        uid,
        analyticsEvent: 'delete_personal_box',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchIfPersonalPillboxUsed: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/pillbox/used?startDate=${start}`,
        method: 'GET',
        origin: 'GET_PILLBOX_USED',
        uid,
        analyticsEvent: 'fetch_if_pillbox_used',
        analyticsData: { calendarId, uid, startDate: start },
        showAlert,
      });
    },

    useMedicinesForPersonalPillbox: async (calendarId, startDate = null) => {
      const start = startDate || toISO(new Date());
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/pillbox/used`,
        method: 'POST',
        body: { startDate: start },
        origin: 'USE_PILLBOX',
        uid,
        analyticsEvent: 'use_pillbox_medication',
        analyticsData: { calendarId, uid, startDate: start },
        showAlert,
      });
    },

    cancelUsePersonalPillbox: async (calendarId, useId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/pillbox/uses/${useId}`,
        method: 'DELETE',
        origin: 'CANCEL_PILLBOX_USE',
        uid,
        analyticsEvent: 'cancel_use_personal_pillbox',
        analyticsData: { calendarId, useId, uid },
        showAlert,
      });
    },

    fetchPersonalPillboxUses: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/pillbox/uses`,
        method: 'GET',
        origin: 'GET_PILLBOX_USES',
        uid,
        analyticsEvent: 'fetch_personal_pillbox_uses',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchPersonalStockDecrementMethod: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/stock-decrement-method`,
        method: 'GET',
        origin: 'PERSONNAL_STOCK_DECREMENT_METHOD_FETCH',
        uid,
        analyticsEvent: 'fetch_stock_decrement_method',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    updatePersonalStockDecrementMethod: async (calendarId, method) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/stock-decrement-method`,
        method: 'PATCH',
        body: { method },
        origin: 'PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE',
        uid,
        analyticsEvent: 'update_stock_decrement_method',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    personalRestockBox: async (calendarId, boxId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/boxes/${boxId}/restock`,
        method: 'POST',
        origin: 'BOX_RESTOCK',
        uid,
        analyticsEvent: 'restock_personal_box',
        analyticsData: { calendarId, boxId, uid },
        showAlert,
      });
    },

    fetchPersonalNotificationsEnabled: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/notifications`,
        method: 'GET',
        origin: 'PERSONAL_NOTIFICATIONS_ENABLED_FETCH',
        uid,
        analyticsEvent: 'fetch_personal_notifications_enabled',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    updatePersonalNotificationsEnabled: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/notifications`,
        method: 'PATCH',
        origin: 'PERSONAL_NOTIFICATIONS_ENABLED_UPDATE',
        uid,
        analyticsEvent: 'update_personal_notifications_enabled',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    fetchPersonalScheduleNegativeStock: async (calendarId, medsId) => {
      const medsIdParam = encodeURIComponent(JSON.stringify(medsId));
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/schedule/negative-stock?medsId=${medsIdParam}`,
        method: 'GET',
        origin: 'PERSONAL_SCHEDULE_NEGATIVE_STOCK',
        uid,
        analyticsEvent: 'fetch_personal_schedule_negative_stock',
        analyticsData: { calendarId, uid, medsId },
        showAlert,
      });
    },

    getTokensIcs: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/ics`,
        method: 'GET',
        origin: 'GET_ICS_TOKENS',
        uid,
        analyticsEvent: 'get_ics_tokens',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    createTokenIcs: async (calendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/ics`,
        method: 'POST',
        origin: 'CREATE_ICS_TOKEN',
        uid,
        analyticsEvent: 'create_ics_token',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    deleteTokenIcs: async (calendarId, tokenId) => {
      return performApiCall({
        url: `${apiUrl}/api/calendars/${calendarId}/ics/${tokenId}`,
        method: 'DELETE',
        origin: 'DELETE_ICS_TOKEN',
        uid,
        analyticsEvent: 'delete_ics_token',
        analyticsData: { calendarId, tokenId, uid },
        showAlert,
      });
    },

    getPersonalCalendarPdfUrl: (calendarId, includeInactive) => {
      return `${apiUrl}/api/calendars/${calendarId}/pdf?includeInactive=${includeInactive}`;
    },
  };
}
