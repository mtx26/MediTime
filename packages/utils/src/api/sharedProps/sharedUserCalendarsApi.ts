import { toISO } from '../../date/dateUtils';
import type {
  ApiResult,
  ApiFactoryOptions,
  BoxId,
  CalendarBoxInput,
  CalendarId,
  InvitationToken,
  MedicineReviewConditionInput,
  MissedIntakesPayload,
  PersonalBoxResult,
  TokenId,
} from '@meditime/types';

export function createSharedUserCalendarsApi({ apiUrl, uid, showAlert, performApiCall }: ApiFactoryOptions) {
  return {
    sendInvitation: async (email: string, calendarId: CalendarId) => {
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

    getLoginInvitation: async (token: InvitationToken) => {
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

    deleteLoginInvitation: async (token: InvitationToken) => {
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

    acceptLoginInvitation: async (token: InvitationToken) => {
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

    rejectLoginInvitation: async (token: InvitationToken) => {
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

    getRegistrationInvitation: async (token: InvitationToken) => {
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

    deleteRegistrationInvitation: async (token: InvitationToken) => {
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

    acceptRegistrationInvitation: async (token: InvitationToken) => {
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

    rejectRegistrationInvitation: async (token: InvitationToken) => {
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

    deleteSharedCalendar: async (calendarId: CalendarId) => {
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

    fetchSharedUserCalendarSchedule: async (
      calendarId: CalendarId,
      startDate: string | null = null
    ): Promise<ApiResult> => {
      const start = startDate || toISO(new Date());

      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'SHARED_CALENDAR_FETCH_SCHEDULE',
        uid,
        analyticsEvent: 'fetch_shared_user_calendar_schedule',
        analyticsData: { calendarId, uid, startDate: start },
        showAlert,
      });
    },

    fetchSharedUserBoxes: async (calendarId: CalendarId) => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/boxes`,
        method: 'GET',
        origin: 'SHARED_USER_CALENDAR_BOXES_FETCH',
        uid,
        analyticsEvent: 'fetch_shared_calendar_medicine_boxes',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    updateSharedUserBox: async (calendarId: CalendarId, boxId: BoxId, box: Partial<CalendarBoxInput>) => {
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
      calendarId: CalendarId,
      name: string,
      boxCapacity: number,
      stockAlertThreshold: number,
      stockQuantity: number,
      dose: number | string | null,
      conditions: MedicineReviewConditionInput[],
      codeFmd: string | null = null
    ): Promise<PersonalBoxResult> => {
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
          } as CalendarBoxInput,
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
          boxId: result.box_id as string,
        };
      }

      return result;
    },

    deleteSharedUserBox: async (calendarId: CalendarId, boxId: BoxId) => {
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

    fetchIfSharedUserPillboxUsed: async (calendarId: CalendarId, startDate: string | null = null) => {
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

    useMedicinesForSharedUserPillbox: async (calendarId: CalendarId, startDate: string | null = null) => {
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

    cancelUseSharedUserPillbox: async (calendarId: CalendarId, useId: string) => {
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

    fetchSharedUserPillboxUses: async (calendarId: CalendarId) => {
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

    sharedUserRestockBox: async (calendarId: CalendarId, boxId: BoxId) => {
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

    fetchSharedUserNotificationsEnabled: async (calendarId: CalendarId) => {
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

    updateSharedUserNotificationsEnabled: async (calendarId: CalendarId) => {
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

    fetchSharedUserStockDecrementMethod: async (calendarId: CalendarId) => {
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

    fetchSharedUserScheduleNegativeStock: async (calendarId: CalendarId, medsId: string[]) => {
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

    getSharedTokensIcs: async (calendarId: CalendarId) => {
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

    createSharedTokenIcs: async (calendarId: CalendarId) => {
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

    deleteSharedTokenIcs: async (calendarId: CalendarId, tokenId: TokenId) => {
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

    applySharedUserMissedIntakes: async (calendarId: CalendarId, payload: MissedIntakesPayload): Promise<ApiResult> => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/missed-intakes`,
        method: 'POST',
        body: payload,
        origin: 'APPLY_SHARED_USER_MISSED_INTAKES',
        uid,
        analyticsEvent: 'apply_shared_user_missed_intakes',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },

    previewSharedUserMissedIntakes: async (calendarId: CalendarId, payload: MissedIntakesPayload): Promise<ApiResult> => {
      return performApiCall({
        url: `${apiUrl}/api/shared/users/calendars/${calendarId}/missed-intakes/preview`,
        method: 'POST',
        body: payload,
        origin: 'PREVIEW_SHARED_USER_MISSED_INTAKES',
        uid,
        analyticsEvent: 'preview_shared_user_missed_intakes',
        analyticsData: { calendarId, uid },
        showAlert,
      });
    },
  };
}
