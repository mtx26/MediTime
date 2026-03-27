/* -------------------------------------------------------------------------- */
/* Calendar Contracts Types                                                   */
/* -------------------------------------------------------------------------- */

import type { ApiResponse } from '../api';
import type { Calendar } from '../domain';

export type CalendarId = Calendar['id'];
export type BoxId = string;
export type TokenId = string;
export type InvitationToken = string;

export interface CalendarBoxInput {
  name: string;
  dose: number | string | null;
  box_capacity: number;
  stock_alert_threshold: number;
  stock_quantity: number;
  code_fmd?: string | null;
  conditions: unknown[];
}

export interface CalendarScheduleResponse extends ApiResponse {
  schedule: unknown[];
  calendar_name?: string;
  if_low_stock?: boolean;
  table?: Record<string, unknown>;
}

export interface IcsToken {
  id: TokenId;
  token: string;
  created_at?: string;
}

export interface NormalizedCalendarSchedule extends ApiResponse {
  schedule: unknown[];
  calendarName: string;
  table: Record<string, unknown>;
  ifLowStock?: boolean;
}
