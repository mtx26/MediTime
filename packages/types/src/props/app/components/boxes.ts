import type { CalendarBoxAlertItem } from './calendar-pages';
import type { MedicineReviewConditionInput } from './imports';

/* -------------------------------------------------------------------------- */
/* BoxesView Types                                                            */
/* -------------------------------------------------------------------------- */

export type BoxesViewBoxItem = CalendarBoxAlertItem & {
  code_fmd?: string | null;
  conditions: MedicineReviewConditionInput[];
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
  fetchSuggestions: (name: string, dose?: number | null) => Promise<unknown[]>;
}
