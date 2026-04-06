// ─── Calendar Contract Types ─────────────────────────────────────────────────

import type { ApiResponse } from '../api/index';
import type { Calendar } from '../../models/index';
import type { MedicineReviewConditionInput } from '../../models/medicine';
import type { CalendarTable, WeeklyEventItem } from '../../models/schedule';

export type CalendarId = Calendar['id'];
export type BoxId = string;
export type TokenId = string;
export type InvitationToken = string;

export interface CalendarBoxInput {
  name: string;
  dose: number | null;
  box_capacity: number;
  stock_alert_threshold: number;
  stock_quantity: number;
  code_fmd?: string | null;
  conditions: MedicineReviewConditionInput[];
}

export interface CalendarScheduleResponse extends ApiResponse {
  schedule: WeeklyEventItem[];
  calendar_name?: string;
  if_low_stock?: boolean;
  table?: CalendarTable;
}

export interface IcsToken {
  id: TokenId;
  token: string;
  created_at?: string;
}

export interface NormalizedCalendarSchedule extends ApiResponse {
  schedule: WeeklyEventItem[];
  calendarName: string;
  table: CalendarTable;
  ifLowStock?: boolean;
}
