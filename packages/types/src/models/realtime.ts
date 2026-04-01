/* -------------------------------------------------------------------------- */
/* Realtime Models                                                            */
/* -------------------------------------------------------------------------- */

export type SourceType = 'personal' | 'shared';

export type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeChannelConfig {
  channelName: string;
  event?: RealtimeEvent;
  schema?: string;
  table: string;
  filter?: string;
}

export interface BoxItem {
  name: string;
  [key: string]: unknown;
}

export interface CalendarItem {
  id: string | number;
  name: string;
  [key: string]: unknown;
}

export interface MedicineItem {
  name: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  timestamp: string;
  [key: string]: unknown;
}

export interface BoxesResponse {
  boxes: BoxItem[];
  message?: string;
  error?: string;
}

export interface CalendarsResponse {
  calendars?: CalendarItem[];
  message?: string;
  error?: string;
}

export interface MedicinesResponse {
  medicines: MedicineItem[];
  message?: string;
  error?: string;
  calendar_id?: string | number;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  message?: string;
  error?: string;
}
