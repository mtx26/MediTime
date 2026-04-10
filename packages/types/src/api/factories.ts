// ─── API Factory Return Types ────────────────────────────────────────────────

import type { ApiResult } from './result';
import type { CalendarId, BoxId, TokenId, InvitationToken, CalendarBoxInput } from './calendar';
import type { MedicineReviewConditionInput, MedicineReviewMedicineInput } from '../models/medicine';
import type { MissedIntakesPayload, SharedCalendarAccess, StockDecrementMethod } from '../models/realtime';

export type PersonalBoxResult = ApiResult & { boxId?: string };

export interface PersonalCalendarsApi {
  addCalendar: (calendarName: string) => Promise<ApiResult>;
  deleteCalendar: (calendarId: CalendarId) => Promise<ApiResult>;
  renameCalendar: (calendarId: CalendarId, newCalendarName: string) => Promise<ApiResult>;
  fetchPersonalCalendarSchedule: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  updatePersonalBox: (calendarId: CalendarId, boxId: BoxId, box: Partial<CalendarBoxInput>) => Promise<ApiResult>;
  createPersonalBox: (
    calendarId: CalendarId,
    name: string,
    boxCapacity: number,
    stockAlertThreshold: number,
    stockQuantity: number,
    dose: number | string | null,
    conditions: MedicineReviewConditionInput[],
    codeFmd?: string | null,
  ) => Promise<PersonalBoxResult>;
  deletePersonalBox: (calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>;
  fetchIfPersonalPillboxUsed: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  useMedicinesForPersonalPillbox: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  cancelUsePersonalPillbox: (calendarId: CalendarId, useId: string) => Promise<ApiResult>;
  fetchPersonalPillboxUses: (calendarId: CalendarId) => Promise<ApiResult>;
  fetchPersonalStockDecrementMethod: (calendarId: CalendarId) => Promise<ApiResult>;
  updatePersonalStockDecrementMethod: (calendarId: CalendarId, method: StockDecrementMethod) => Promise<ApiResult>;
  personalRestockBox: (calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>;
  fetchPersonalNotificationsEnabled: (calendarId: CalendarId) => Promise<ApiResult>;
  updatePersonalNotificationsEnabled: (calendarId: CalendarId) => Promise<ApiResult>;
  fetchPersonalScheduleNegativeStock: (calendarId: CalendarId, medsId: string[]) => Promise<ApiResult>;
  getTokensIcs: (calendarId: CalendarId) => Promise<ApiResult>;
  createTokenIcs: (calendarId: CalendarId) => Promise<ApiResult>;
  deleteTokenIcs: (calendarId: CalendarId, tokenId: TokenId) => Promise<ApiResult>;
  getPersonalCalendarPdfUrl: (calendarId: CalendarId, includeInactive: boolean) => string;
  applyPersonalMissedIntakes: (calendarId: CalendarId, payload: MissedIntakesPayload) => Promise<ApiResult>;
}

export interface SharedUserCalendarsApi {
  sendInvitation: (email: string, calendarId: CalendarId) => Promise<ApiResult>;
  getLoginInvitation: (token: InvitationToken) => Promise<ApiResult>;
  deleteLoginInvitation: (token: InvitationToken) => Promise<ApiResult>;
  acceptLoginInvitation: (token: InvitationToken) => Promise<ApiResult>;
  rejectLoginInvitation: (token: InvitationToken) => Promise<ApiResult>;
  getRegistrationInvitation: (token: InvitationToken) => Promise<ApiResult>;
  deleteRegistrationInvitation: (token: InvitationToken) => Promise<ApiResult>;
  acceptRegistrationInvitation: (token: InvitationToken) => Promise<ApiResult>;
  rejectRegistrationInvitation: (token: InvitationToken) => Promise<ApiResult>;
  deleteSharedCalendar: (calendarId: CalendarId) => Promise<ApiResult>;
  fetchGroupedSharedCalendars: () => Promise<ApiResult>;
  fetchSharedUserCalendarSchedule: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  updateSharedUserBox: (calendarId: CalendarId, boxId: BoxId, box: Partial<CalendarBoxInput>) => Promise<ApiResult>;
  createSharedUserBox: (
    calendarId: CalendarId,
    name: string,
    boxCapacity: number,
    stockAlertThreshold: number,
    stockQuantity: number,
    dose: number | string | null,
    conditions: MedicineReviewConditionInput[],
    codeFmd?: string | null,
  ) => Promise<PersonalBoxResult>;
  deleteSharedUserBox: (calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>;
  fetchIfSharedUserPillboxUsed: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  useMedicinesForSharedUserPillbox: (calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>;
  cancelUseSharedUserPillbox: (calendarId: CalendarId, useId: string) => Promise<ApiResult>;
  fetchSharedUserPillboxUses: (calendarId: CalendarId) => Promise<ApiResult>;
  sharedUserRestockBox: (calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>;
  fetchSharedUserNotificationsEnabled: (calendarId: CalendarId) => Promise<ApiResult>;
  updateSharedUserNotificationsEnabled: (calendarId: CalendarId) => Promise<ApiResult>;
  fetchSharedUserStockDecrementMethod: (calendarId: CalendarId) => Promise<ApiResult>;
  fetchSharedUserScheduleNegativeStock: (calendarId: CalendarId, medsId: string[]) => Promise<ApiResult>;
  getSharedTokensIcs: (calendarId: CalendarId) => Promise<ApiResult>;
  createSharedTokenIcs: (calendarId: CalendarId) => Promise<ApiResult>;
  deleteSharedTokenIcs: (calendarId: CalendarId, tokenId: TokenId) => Promise<ApiResult>;
  applySharedUserMissedIntakes: (calendarId: CalendarId, payload: MissedIntakesPayload) => Promise<ApiResult>;
}

export interface TokenCalendarsApi {
  fetchTokenCalendarSchedule: (token: string, startDate?: string | null) => Promise<ApiResult>;
  createToken: (calendarId: CalendarId, expiresAt: string | null, permissions: SharedCalendarAccess) => Promise<ApiResult>;
  deleteToken: (token: string) => Promise<ApiResult>;
  updateTokenExpiration: (token: string, expiresAt: string | null) => Promise<ApiResult>;
}

export interface NotificationsApi {
  readNotification: (notificationId: string) => Promise<ApiResult>;
  readAllNotifications: () => Promise<ApiResult>;
}

export interface UserApi {
  fetchNotificationTime: () => Promise<ApiResult>;
  updateNotificationTime: (notificationTime: string) => Promise<ApiResult>;
}

export interface DocumentsApi {
  analyzeImage: (file: File) => Promise<ApiResult>;
  saveAnalysisResult: (calendarName: string, boxes: MedicineReviewMedicineInput[]) => Promise<ApiResult>;
}
