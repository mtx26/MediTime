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

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipsProps<TNode = unknown> {
  children: TNode;
  content?: TNode;
  side?: TooltipSide;
  className?: string;
  propagation?: boolean;
}