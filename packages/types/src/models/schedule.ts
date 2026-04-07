// ─── Schedule & Event Models ─────────────────────────────────────────

export type DateLike = string | number | Date;

export interface WeeklyEventItem {
  start: string;
  title: string;
  color?: string;
  dose?: number | null;
  notes?: string | null;
  tablet_count?: number | null;
}

// ─── Pillbox & Calendar Table Models ─────────────────────────────────

export interface PillboxTableMed {
  title: string;
  cells: Record<string, number>;
}

export interface PillboxOrderedMed extends PillboxTableMed {
  moment: string;
}

export type PillboxTable = Record<string, PillboxTableMed[]>;

export type CalendarTable = Record<string, WeeklyEventItem[] | PillboxTableMed[]>;
