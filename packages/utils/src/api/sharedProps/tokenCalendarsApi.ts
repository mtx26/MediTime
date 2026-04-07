import { toISO } from '../../date/dateUtils';
import type { ApiFactoryOptions, ApiResult, CalendarId, SharedCalendarAccess } from '@meditime/types';

export function createTokenCalendarsApi({ apiUrl, uid, showAlert, performApiCall }: ApiFactoryOptions) {
  return {
    fetchTokenCalendarSchedule: async (
      token: string,
      startDate: string | null = null
    ): Promise<ApiResult> => {
      const start = startDate || toISO(new Date());

      return performApiCall({
        url: `${apiUrl}/api/tokens/${token}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'TOKEN_FETCH_SCHEDULE',
        analyticsEvent: 'fetch_token_calendar_schedule',
        analyticsData: { token, startTime: start },
        showAlert,
      });
    },

    createToken: async (calendarId: CalendarId, expiresAt: string | null, permissions: SharedCalendarAccess) => {
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

    deleteToken: async (token: string) => {
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

    updateTokenExpiration: async (token: string, expiresAt: string | null) => {
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
