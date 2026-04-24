import type { CalendarBoxAlertItem } from './calendar-pages';
import type { MedicineReviewConditionInput, MedicineReviewSuggestion } from '../models/medicine';

// ─── BoxesView Types ─────────────────────────────────────────────────────────

export type BoxesViewBoxItem = Omit<CalendarBoxAlertItem, 'conditions'> & {
  code_fmd?: string | null;
  conditions: EditableCondition[];
};

export type StatusBadgeVariant = 'warning' | 'danger' | 'success' | 'secondary' | 'info';

export interface StatusBadgeProps<TIcon = unknown> {
  variant: StatusBadgeVariant;
  icon?: TIcon;
  text: string;
  tooltip?: string;
}

export interface ActionCardProps<TIcon = unknown> {
  variant: 'success' | 'primary';
  icon: TIcon;
  text: string;
  onClick: () => void;
  hasTooltip?: boolean;
  tooltip?: string;
  dataTour?: string;
}

export interface InputDropdownProps {
  name: string;
  dose: number | null;
  onChangeName: (value: string) => void;
  onChangeDose: (value: number) => void;
  onChangeBoxCapacity: (value: number) => void;
  onChangeStockQuantity: (value: number) => void;
  onChangeCodeFmd: (value: string) => void;
  fetchSuggestions: (name: string, dose?: number | null) => Promise<MedicineReviewSuggestion[]>;
}

export interface MobileMedicineBoxCardProps<TAction = unknown> {
  box: BoxesViewBoxItem | CalendarBoxAlertItem;
  actions?: TAction[];
  disabled?: boolean;
  mode?: 'alerts' | 'full';
  expanded?: boolean;
  onEdit?: (() => void) | null;
  onMissingPillbox?: ((boxId: string) => void) | null;
  onRestock?: ((boxId: string) => void) | null;
  onToggleExpanded?: (() => void) | null;
}

// ─── Condition Editing Types ─────────────────────────────────────────────────

export type EditableCondition = MedicineReviewConditionInput & { id: string };
export type ConditionFieldKey = keyof MedicineReviewConditionInput;
export type ConditionValue = string | number | null | undefined;
export type ConditionFieldType = 'number' | 'select' | 'date';
export type ConditionOption = { value: string; label: string };

export type ConditionFieldConfig = {
  label: string | ((cond: EditableCondition) => string);
  field: ConditionFieldKey | ((cond: EditableCondition) => ConditionFieldKey);
  type: ConditionFieldType | ((cond: EditableCondition) => ConditionFieldType);
  min?: string;
  step?: string;
  format?: string | ((cond: EditableCondition) => string);
  options?: ConditionOption[];
  ifComplete?: (cond: EditableCondition) => boolean;
  onChange?: (
    cond: EditableCondition,
    value: ConditionValue,
    updateFn: (field: ConditionFieldKey, value: ConditionValue) => void,
  ) => void;
  required?: boolean | ((cond: EditableCondition) => boolean);
};

// ─── Editing State Types ─────────────────────────────────────────────────────

export interface EditingBoxState {
  name: string;
  dose: number | null;
  box_capacity: number | null;
  stock_alert_threshold: number | null;
  stock_quantity: number | null;
  code_fmd: string | null;
  conditions: Record<string, EditableCondition | undefined>;
}
