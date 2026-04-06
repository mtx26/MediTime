import type { MedicineReviewConditionInput } from '@meditime/types';
import { MEDICINE_REVIEW_TIME_OF_DAY_HOURS } from '@meditime/constants';

/**
 * Parse a value to integer.
 */
export const toInt = (value: string | number): number =>
  Number.parseInt(String(value), 10);

/**
 * Calculate a max_date ISO string from a number of days and time of day.
 * If the current time is before the target hour, today counts as day 1.
 */
export function calculateMaxDateFromDays(
  days: number,
  timeOfDay: string | number | null | undefined,
  referenceDate: Date = new Date(),
): string {
  const now = new Date(referenceDate);
  const target = new Date(now);
  const targetHour =
    MEDICINE_REVIEW_TIME_OF_DAY_HOURS[
      String(timeOfDay) as keyof typeof MEDICINE_REVIEW_TIME_OF_DAY_HOURS
    ] ?? 8;
  target.setHours(targetHour, 0, 0, 0);

  const includeToday = now < target;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (includeToday ? days - 1 : days));
  endDate.setHours(23, 59, 59, 999);
  return endDate.toISOString();
}

/**
 * Apply side-effects when a condition field changes.
 * Returns the updated condition with dependent fields cleared/computed.
 */
export function applyConditionFieldSideEffects(
  condition: MedicineReviewConditionInput,
  field: string,
  value: string | number | null,
): MedicineReviewConditionInput {
  const updated = { ...condition };

  // When interval_days ≤ 1, clear start_date
  if (field === 'interval_days' && toInt(value ?? 0) <= 1) {
    updated.start_date = null;
  }

  // When max_date_mode changes, clear dependent fields
  if (field === 'max_date_mode') {
    updated.max_date = null;
    updated.max_date_days = null;
  }

  // Calculate max_date from days
  if (field === 'max_date_days' && value) {
    updated.max_date = calculateMaxDateFromDays(
      toInt(value),
      condition.time_of_day,
    );
    updated.max_date_days = toInt(value);
  } else if (field === 'max_date' && value) {
    const selectedDate = new Date(String(value));
    selectedDate.setHours(23, 59, 59, 999);
    updated.max_date = selectedDate.toISOString();
  }

  // Set the actual field value
  (updated as Record<string, unknown>)[field] = value ?? '';

  return updated;
}
