import type { DateLike, WeeklyEventItem } from '../models';
import type { IcsTokenEntry, PillboxUseItem } from './calendar-pages';

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

export interface CalendarHeaderTitleProps {
  title: string;
}

export interface CalendarNotFoundStateProps {
  onBackToCalendars: () => void;
}

export interface IcsTokenCardProps {
  token: IcsTokenEntry;
  webcalUrl: string;
  disabled?: boolean;
  onDelete: (token: IcsTokenEntry) => void;
  onShare: (url: string) => void;
  onSubscribe: (url: string) => void;
}

export interface PillboxUseRowProps {
  use: PillboxUseItem;
  weekLabel: string;
  disabled?: boolean;
  onCancel: (useId: string) => void;
}
