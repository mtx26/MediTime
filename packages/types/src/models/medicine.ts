// ─── Medicine Data Models ────────────────────────────────────────────────────

import type { TimeOfDay } from './realtime';

export interface MedicineReviewConditionInput {
  time_of_day?: TimeOfDay;
  interval_days?: number | string;
  start_date?: string | null;
  tablet_count?: number | string;
  max_date_mode?: 'date' | 'days' | 'none';
  max_date?: string | null;
  max_date_days?: number | string | null;
}

export interface MedicineReviewMedicineInput {
  name: string;
  dose: number | string | null;
  stock_quantity?: number | string;
  stock_max?: number | string;
  stock_alert_threshold?: number | string;
  conditions: MedicineReviewConditionInput[];
}

export interface MedicineReviewSuggestion {
  name: string;
  dose: string;
  conditionnement: string;
  forme_pharmaceutique?: string;
  code_fmd?: string | null;
}
