import { update } from "lodash";

export const getCalendarSourceMap = (
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars
) => ({
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
    restockBox: personalCalendars.personalRestockBox,
    fetchNotificationsEnabled: null, // TODO: notification pour calendars
    updateNotificationsEnabled: null,
    fetchStockDecrementMethod: personalCalendars.fetchPersonalStockDecrementMethod,
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
    restockBox: sharedUserCalendars.sharedUserRestockBox,
    fetchNotificationsEnabled: sharedUserCalendars.fetchSharedUserNotificationsEnabled,
    updateNotificationsEnabled: sharedUserCalendars.updateSharedUserNotificationsEnabled,
    fetchStockDecrementMethod: sharedUserCalendars.fetchSharedUserStockDecrementMethod,
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
    restockBox: null,
    fetchNotificationsEnabled: null,
    updateNotificationsEnabled: null,
    fetchStockDecrementMethod: null
  },
});
