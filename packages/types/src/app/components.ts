/* -------------------------------------------------------------------------- */
/* App Component Props Types                                                   */
/* -------------------------------------------------------------------------- */

export interface ArrowControlsProps {
  onLeft: () => void;
  onRight: () => void;
}

export interface ThemeToggleProps {
  className?: string;
}

export type DateLike = string | number | Date;

export interface WeekDayCirclesProps {
  selectedDate: Exclude<DateLike, number>;
  onSelectDate: (date: Date) => void;
}

export interface WeekCalendarSelectorProps {
  selectedDate?: DateLike | null;
  onWeekSelect: (date: Date) => void;
}

export interface WeeklyEventItem {
  start: string;
  title: string;
  color?: string;
  dose?: number | string | null;
  notes?: string | null;
  tablet_count?: number | string | null;
  [key: string]: unknown;
}

export interface WeeklyEventContentProps {
  ifModal: boolean;
  selectedDate: DateLike | null | undefined;
  eventsForDay: WeeklyEventItem[];
  onSelectDate: (date: Date) => void;
  onNext: () => void;
  onPrev: () => void;
  getPastWeek: () => void;
  getNextWeek: () => void;
}

export interface ActionSheetAction<TLabel = unknown> {
  label?: TLabel;
  title?: string;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
}

export interface ActionSheetProps<TLabel = unknown> {
  actions: ActionSheetAction<TLabel>[];
  buttonSize?: 'sm' | 'default' | string;
  dataTour?: string;
}

export interface IconButtonProps<TIcon = unknown> {
  className?: string;
  icon?: TIcon;
  text: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  helpDisabled?: string;
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipsProps<TNode = unknown> {
  children: TNode;
  content?: TNode;
  side?: TooltipSide;
  className?: string;
  propagation?: boolean;
}