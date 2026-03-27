import { toISO } from '../../date/dateUtils';

export function createTokenCalendarsApi({ apiUrl, uid, showAlert, performApiCall }) {
  return {
    fetchTokenCalendarSchedule: async (token, startDate = null) => {
      const start = startDate || toISO(new Date());

      const result = await performApiCall({
        url: `${apiUrl}/api/tokens/${token}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'TOKEN_FETCH_SCHEDULE',
        analyticsEvent: 'fetch_token_calendar_schedule',
        analyticsData: { token, startTime: start },
        showAlert,
      });

      return {
        success: result.success,
        message: result.message,
        code: result.code,
        schedule: result.schedule ?? [],
        calendarName: result.calendar_name ?? '',
        table: result.table ?? {},
        error: result.error,
      };
    },

    createToken: async (calendarId, expiresAt, permissions) => {
      return performApiCall({
        url: `${apiUrl}/api/tokens/${calendarId}`,
        method: 'POST',
        body: { expiresAt, permissions },
        origin: 'TOKEN_CREATE',
        analyticsEvent: 'create_token',
        analyticsData: { calendarId },
        showAlert,
      });
    },

    deleteToken: async (token) => {
      return performApiCall({
        url: `${apiUrl}/api/tokens/${token}`,
        method: 'DELETE',
        origin: 'TOKEN_DELETE',
        uid,
        analyticsEvent: 'delete_token',
        analyticsData: { token, uid },
        showAlert,
      });
    },

    updateTokenExpiration: async (token, expiresAt) => {
      return performApiCall({
        url: `${apiUrl}/api/tokens/expiration/${token}`,
        method: 'PATCH',
        body: { expiresAt },
        origin: 'TOKEN_EXPIRATION_UPDATE',
        uid,
        analyticsEvent: 'update_token_expiration',
        analyticsData: { token, uid, expiresAt },
        showAlert,
      });
    },
  };
}
