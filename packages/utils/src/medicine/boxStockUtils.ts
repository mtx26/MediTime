import type { BoxesViewBoxItem, CalendarBoxAlertItem, StatusBadgeVariant } from '@meditime/types';

type StockBox = Pick<
  BoxesViewBoxItem | CalendarBoxAlertItem,
  'stock_quantity' | 'stock_alert_threshold' | 'box_capacity'
>;

/**
 * Box stock quantity is 0 or negative — no pills left (or over-consumed).
 */
export function isBoxCritical(box: StockBox): boolean {
  return box.stock_quantity <= 0;
}

/**
 * Box stock is above 0 but at or below the alert threshold.
 * Requires a valid (> 0) threshold to be meaningful.
 */
export function isBoxLowStock(box: StockBox): boolean {
  return (
    !isBoxCritical(box)
    && box.stock_alert_threshold > 0
    && box.stock_quantity <= box.stock_alert_threshold
  );
}

/**
 * Stock is negative — more doses were recorded than pills available.
 * This indicates a missing / untracked pillbox.
 */
export function isBoxMissingPillbox(box: StockBox): boolean {
  return box.stock_quantity < 0;
}

/**
 * Returns a single status token for a box's stock level.
 * - 'disabled'  → alerts are turned off (no capacity or no threshold)
 * - 'critical'  → stock_quantity <= 0
 * - 'low'       → above 0 but at/below threshold
 * - 'ok'        → above threshold
 */
export type BoxStockStatus = 'disabled' | 'critical' | 'low' | 'ok';

export function getBoxStockStatus(box: StockBox): BoxStockStatus {
  if (box.box_capacity <= 0 || box.stock_alert_threshold <= 0) return 'disabled';
  if (isBoxCritical(box)) return 'critical';
  if (isBoxLowStock(box)) return 'low';
  return 'ok';
}

// ─── Condition Expiry Helpers ─────────────────────────────────────────────────

type ConditionWithDate = { max_date?: string | null };

/**
 * Returns true if the condition has a max_date that is in the past.
 */
export function isConditionExpired(condition: ConditionWithDate | null | undefined): boolean {
  if (!condition?.max_date) return false;
  return new Date() > new Date(condition.max_date);
}

/**
 * Returns true if the box has at least one condition and ALL of them are expired.
 */
export function hasOnlyExpiredConditions(box: { conditions: ConditionWithDate[] }): boolean {
  return box.conditions.length > 0 && box.conditions.every(isConditionExpired);
}

/**
 * Returns true if at least one condition is expired.
 */
export function hasSomeExpiredConditions(box: { conditions: ConditionWithDate[] }): boolean {
  return box.conditions.some(isConditionExpired);
}

// ─── Status Item Helpers ──────────────────────────────────────────────────────

type BoxForStatus = StockBox & {
  conditions?: Array<ConditionWithDate | null | undefined>;
};

/**
 * Discriminated key for each possible status item on a medicine box.
 * Used by each platform to map to the appropriate icon.
 */
export type BoxStatusItemKey =
  | 'condition_none'
  | 'condition_inactive'
  | 'condition_expired'
  | 'stock_out'
  | 'stock_low'
  | 'stock_ok'
  | 'alerts_disabled';

export interface BoxStatusItem {
  key: BoxStatusItemKey;
  variant: StatusBadgeVariant;
  i18nKey: string;
}

/**
 * Returns an ordered list of platform-agnostic status items for a medicine box.
 * Each item has a discriminated `key` for icon mapping, a badge `variant`,
 * and an `i18nKey` for translation. No platform-specific icons or colors.
 */
export function getBoxStatusItems(box: BoxForStatus): BoxStatusItem[] {
  const items: BoxStatusItem[] = [];

  if (box.conditions !== undefined) {
    const valid = box.conditions.filter(Boolean) as ConditionWithDate[];
    if (valid.length === 0) {
      items.push({ key: 'condition_none', variant: 'warning', i18nKey: 'boxes.condition.none' });
    } else if (hasOnlyExpiredConditions({ conditions: valid })) {
      items.push({ key: 'condition_inactive', variant: 'info', i18nKey: 'boxes.condition.inactive' });
    } else if (hasSomeExpiredConditions({ conditions: valid })) {
      items.push({ key: 'condition_expired', variant: 'info', i18nKey: 'boxes.condition.expired' });
    }
  }

  const stockStatus = getBoxStockStatus(box);

  if (stockStatus === 'disabled') {
    items.push({ key: 'alerts_disabled', variant: 'info', i18nKey: 'boxes.stock.badge.alerts_disabled' });
    return items;
  }

  switch (stockStatus) {
    case 'critical': items.push({ key: 'stock_out', variant: 'danger', i18nKey: 'boxes.stock.badge.out' }); break;
    case 'low':      items.push({ key: 'stock_low', variant: 'warning', i18nKey: 'boxes.stock.badge.low' }); break;
    case 'ok':       items.push({ key: 'stock_ok', variant: 'success', i18nKey: 'boxes.stock.badge.high' }); break;
  }

  return items;
}

// ─── Display Flags ────────────────────────────────────────────────────────────

export interface BoxDisplayFlags {
  /** Stock is at 0 or below (stock_out badge). */
  isCritical: boolean;
  /** Stock is above 0 but at/below the alert threshold (stock_low badge). */
  isLow: boolean;
  /** Stock is above the threshold (stock_ok badge). */
  isOk: boolean;
  /** Alerts are disabled — no capacity or no threshold (alerts_disabled badge). */
  isDisabled: boolean;
  /** All conditions are expired (condition_inactive badge). */
  allExpired: boolean;
  /** At least one condition is expired but not all (condition_expired badge). */
  someExpired: boolean;
  /** No conditions are configured (condition_none badge). */
  noCondition: boolean;
  /** Stock is negative — more doses recorded than pills available. */
  isMissingPillbox: boolean;
}

/**
 * Returns a flat object of named booleans for rendering decisions (colors, text, borders…).
 * All flags are derived from `getBoxStatusItems` — single source of truth.
 */
export function getBoxDisplayFlags(box: BoxForStatus): BoxDisplayFlags {
  const keys = new Set(getBoxStatusItems(box).map(i => i.key));
  return {
    isCritical:       keys.has('stock_out'),
    isLow:            keys.has('stock_low'),
    isOk:             keys.has('stock_ok'),
    isDisabled:       keys.has('alerts_disabled'),
    allExpired:       keys.has('condition_inactive'),
    someExpired:      keys.has('condition_expired'),
    noCondition:      keys.has('condition_none'),
    isMissingPillbox: box.stock_quantity < 0,
  };
}

// ─── Alert Filter ─────────────────────────────────────────────────────────────

/**
 * Returns true if a box should appear in stock alerts:
 * - alerts are configured (capacity > 0, threshold > 0)
 * - stock is at or below the threshold (critical or low)
 * - no condition is currently expired
 */
export function isStockAlertBox(box: BoxForStatus): boolean {
  const status = getBoxStockStatus(box);
  if (status !== 'critical' && status !== 'low') return false;
  const conditions = (box.conditions ?? []).filter(Boolean) as ConditionWithDate[];
  return !hasSomeExpiredConditions({ conditions });
}
