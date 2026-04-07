// ─── Domain Models ───────────────────────────────────────────────────

export interface Calendar {
  id: string;
  uid: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Language<TDateLocale = unknown, TFlagComponent = unknown> {
  flag: string;
  code: string;
  locale: string;
  label: string;
  dateLocale: TDateLocale;
  FlagComponent: TFlagComponent;
}
