// ─── Realtime Config ─────────────────────────────────────────────────

export type SourceType = 'personal' | 'shared';

export type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeChannelConfig {
  channelName: string;
  event?: RealtimeEvent;
  schema?: string;
  table: string;
  filter?: string;
}

export interface RealtimeOptions {
  enabled: boolean;
  fetchData: () => void | Promise<void>;
  channels: RealtimeChannelConfig[];
  deps?: ReadonlyArray<unknown>;
}

export interface SubscribedChannel {
  unsubscribe: () => void;
}

// ─── Realtime Items ──────────────────────────────────────────────────

export interface BoxItem {
  name: string;
  [key: string]: unknown;
}

export interface CalendarItem {
  id: string;
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

export type TokenItem = Record<string, unknown>;

// ─── Realtime Responses ──────────────────────────────────────────────

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
  calendar_id?: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  message?: string;
  error?: string;
}

export interface TokensResponse {
  tokens: TokenItem[];
  message?: string;
  error?: string;
}
