import type { DateLike, WeeklyEventItem } from '../../../models';

export type { DateLike, WeeklyEventItem };

export interface WeekDayCirclesProps {
  selectedDate: Exclude<DateLike, number>;
  onSelectDate: (date: Date) => void;
}

export interface WeekCalendarSelectorProps {
  selectedDate?: DateLike | null;
  onWeekSelect: (date: Date) => void;
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

export type DateModalProps = Omit<WeeklyEventContentProps, 'ifModal'>;

export interface DateModalRef {
  open: () => void;
  close: () => void;
}
