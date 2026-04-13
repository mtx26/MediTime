
import type {
  ApiResult,
  AppPersonalCalendars,
  AppSharedUserCalendars,
  AppTokenCalendars,
  BoxId,
  CalendarBoxInput,
  CalendarId,
  MedicineReviewConditionInput,
  PersonalBoxResult,
  TokenId,
} from '@meditime/types';
import type { CalendarInfo } from '@meditime/types';

export interface CalendarSourceGroup {
  fetchSchedule: ((calendarId: string, date?: string | null) => Promise<ApiResult>) | null;
  calendarsData: CalendarInfo[] | null;
  setCalendarsData: ((data: CalendarInfo[] | null) => void) | null;
  updateBox: ((calendarId: CalendarId, boxId: BoxId, box: Partial<CalendarBoxInput>) => Promise<ApiResult>) | null;
  createBox: ((calendarId: CalendarId, name: string, boxCapacity: number, stockAlertThreshold: number, stockQuantity: number, dose: number | string | null, conditions: MedicineReviewConditionInput[], codeFmd?: string | null) => Promise<PersonalBoxResult>) | null;
  deleteBox: ((calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>) | null;
  downloadCalendarPdf: ((calendarId: string, includeInactive: boolean) => void) | null;
  deleteCalendar: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  fetchIfPillboxUsed: ((calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>) | null;
  decreaseStock: ((calendarId: CalendarId, startDate?: string | null) => Promise<ApiResult>) | null;
  cancelUse: ((calendarId: CalendarId, useId: string) => Promise<ApiResult>) | null;
  fetchPillboxUses: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  restockBox: ((calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>) | null;
  restockBoxSilent: ((calendarId: CalendarId, boxId: BoxId) => Promise<ApiResult>) | null;
  fetchNotificationsEnabled: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  updateNotificationsEnabled: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  fetchStockDecrementMethod: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  getTokensIcs: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  createTokenIcs: ((calendarId: CalendarId) => Promise<ApiResult>) | null;
  deleteTokenIcs: ((calendarId: CalendarId, tokenId: TokenId) => Promise<ApiResult>) | null;
  fetchScheduleNegativeStock: ((calendarId: CalendarId, medsId: string[]) => Promise<ApiResult>) | null;
}

interface CalendarSourceMap {
  personal: CalendarSourceGroup;
  sharedUser: CalendarSourceGroup;
  token: CalendarSourceGroup;
}

export const getCalendarSourceMap = (
  personalCalendars: AppPersonalCalendars,
  sharedUserCalendars: AppSharedUserCalendars,
  tokenCalendars: AppTokenCalendars
): CalendarSourceMap => ({
  personal: {
    fetchSchedule: personalCalendars.fetchPersonalCalendarSchedule,
    calendarsData: personalCalendars.calendarsData,
    setCalendarsData: personalCalendars.setCalendarsData,
    updateBox: personalCalendars.updatePersonalBox,
    createBox: personalCalendars.createPersonalBox,
    deleteBox: personalCalendars.deletePersonalBox,
    downloadCalendarPdf: personalCalendars.downloadPersonalCalendarPdf,
    deleteCalendar: personalCalendars.deleteCalendar,
    fetchIfPillboxUsed: personalCalendars.fetchIfPersonalPillboxUsed,
    decreaseStock: personalCalendars.useMedicinesForPersonalPillbox,
    cancelUse: personalCalendars.cancelUsePersonalPillbox,
    fetchPillboxUses: personalCalendars.fetchPersonalPillboxUses,
    restockBox: personalCalendars.personalRestockBox,
    restockBoxSilent: personalCalendars.personalRestockBoxSilent,
    fetchNotificationsEnabled: personalCalendars.fetchPersonalNotificationsEnabled,
    updateNotificationsEnabled: personalCalendars.updatePersonalNotificationsEnabled,
    fetchStockDecrementMethod: personalCalendars.fetchPersonalStockDecrementMethod,
    getTokensIcs: personalCalendars.getTokensIcs,
    createTokenIcs: personalCalendars.createTokenIcs,
    deleteTokenIcs: personalCalendars.deleteTokenIcs,
    fetchScheduleNegativeStock: personalCalendars.fetchPersonalScheduleNegativeStock ,
    },
  sharedUser: {
    fetchSchedule: sharedUserCalendars.fetchSharedUserCalendarSchedule,
    calendarsData: sharedUserCalendars.sharedCalendarsData,
    setCalendarsData: sharedUserCalendars.setSharedCalendarsData,
    updateBox: sharedUserCalendars.updateSharedUserBox,
    createBox: sharedUserCalendars.createSharedUserBox,
    deleteBox: sharedUserCalendars.deleteSharedUserBox,
    downloadCalendarPdf: personalCalendars.downloadPersonalCalendarPdf,
    deleteCalendar: null,
    fetchIfPillboxUsed: sharedUserCalendars.fetchIfSharedUserPillboxUsed,
    decreaseStock: sharedUserCalendars.useMedicinesForSharedUserPillbox,
    cancelUse: sharedUserCalendars.cancelUseSharedUserPillbox,
    fetchPillboxUses: sharedUserCalendars.fetchSharedUserPillboxUses,
    restockBox: sharedUserCalendars.sharedUserRestockBox,
    restockBoxSilent: sharedUserCalendars.sharedUserRestockBoxSilent,
    fetchNotificationsEnabled: sharedUserCalendars.fetchSharedUserNotificationsEnabled,
    updateNotificationsEnabled: sharedUserCalendars.updateSharedUserNotificationsEnabled,
    fetchStockDecrementMethod: sharedUserCalendars.fetchSharedUserStockDecrementMethod,
    getTokensIcs: sharedUserCalendars.getSharedTokensIcs,
    createTokenIcs: sharedUserCalendars.createSharedTokenIcs,
    deleteTokenIcs: sharedUserCalendars.deleteSharedTokenIcs,
    fetchScheduleNegativeStock: sharedUserCalendars.fetchSharedUserScheduleNegativeStock,
  },
  token: {
    fetchSchedule: tokenCalendars.fetchTokenCalendarSchedule,
    calendarsData: null,
    setCalendarsData: null,
    // TODO: add updateBox for tokenCalendars
    updateBox: null,
    createBox: null,
    deleteBox: null,
    downloadCalendarPdf: null,
    deleteCalendar: null,
    fetchIfPillboxUsed: null,
    decreaseStock: null,
    cancelUse: null,
    fetchPillboxUses: null,
    restockBox: null,
    restockBoxSilent: null,
    fetchNotificationsEnabled: null,
    updateNotificationsEnabled: null,
    fetchStockDecrementMethod: null,
    getTokensIcs: null,
    createTokenIcs: null,
    deleteTokenIcs: null,
    fetchScheduleNegativeStock: null,
  },
});
