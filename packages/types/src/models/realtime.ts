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
  channels: readonly RealtimeChannelConfig[];
  deps?: readonly unknown[];
}

export interface SubscribedChannel {
  unsubscribe: () => void;
}

// ─── Shared Enums ────────────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'noon' | 'evening';

export type MissedMode = 'intake' | 'medication';

export interface MissedIntakesPayload {
  mode: MissedMode;
  days: string[];
  times?: TimeOfDay[];
  per_day_times?: Record<string, TimeOfDay[]>;
  med_ids?: string[];
}

export type StockDecrementMethod = 'weekly_pillbox' | 'daily_midnight';

export type SharedCalendarAccess = 'read' | 'write' | 'edit' | 'admin';

export type NotificationType =
  | 'calendar_invitation'
  | 'calendar_invitation_accepted'
  | 'calendar_invitation_rejected'
  | 'calendar_shared_deleted_by_owner'
  | 'calendar_shared_deleted_by_receiver'
  | 'low_stock';

// ─── Realtime Items ──────────────────────────────────────────────────

export interface BoxCondition {
  time_of_day?: string | null;
  interval_days?: number | null;
  start_date?: string | null;
  max_date?: string | null;
  tablet_count?: number | null;
}

export interface BoxItem {
  id: string;
  name: string;
  dose?: number | null;
  box_capacity: number;
  stock_quantity: number;
  stock_alert_threshold: number;
  code_fmd?: string | null;
  calendar_id?: string;
  calendar_name?: string;
  conditions?: BoxCondition[];
  url_notice_fr?: string | null;
}

export interface CalendarItem {
  id: string;
  name: string;
  owner_uid?: string;
  boxes_count?: number;
  ifLowStock?: boolean;
  stock_decrement_method?: StockDecrementMethod;
  access?: SharedCalendarAccess;
  owner_name?: string;
  owner_email?: string;
  owner_photo_url?: string;
  notifications_enabled?: boolean;
}

export interface MedicineItem {
  name: string;
  dose?: number | null;
  box_capacity?: number;
  stock_quantity?: number;
  stock_alert_threshold?: number;
  time_of_day?: TimeOfDay[];
  tablet_count?: number;
  interval_days?: number;
  start_date?: string;
}

export interface NotificationItem {
  notification_id: string;
  notification_type: NotificationType;
  read: boolean;
  timestamp: string;
  calendar_id?: string | null;
  calendar_name?: string | null;
  sender_name?: string | null;
  sender_photo_url?: string | null;
  sender_email?: string | null;
  medication_name?: string | null;
  medication_qty?: number | null;
  accepted?: boolean;
  token?: string | null;
}

export interface SharedTokenItem {
  id: string;
  calendar_id?: string;
  expires_at?: string | null;
  owner_uid?: string;
  created_at?: string;
}

export interface IcsTokenItem {
  id: string;
  token: string;
  calendar_id?: string;
  owner_uid?: string;
  owner_display_name?: string;
  owner_photo_url?: string;
  owner_email?: string;
  created_at?: string;
}

export type TokenItem = SharedTokenItem | IcsTokenItem;

// ─── Realtime Responses ──────────────────────────────────────────────

interface BaseRealtimeResponse {
  message?: string;
  error?: string;
}

export interface BoxesResponse extends BaseRealtimeResponse {
  boxes: BoxItem[];
}

export interface CalendarsResponse extends BaseRealtimeResponse {
  calendars?: CalendarItem[];
}

export interface MedicinesResponse extends BaseRealtimeResponse {
  medicines: MedicineItem[];
  calendar_id?: string;
}

export interface NotificationsResponse extends BaseRealtimeResponse {
  notifications: NotificationItem[];
}

export interface TokensResponse extends BaseRealtimeResponse {
  tokens: TokenItem[];
}
