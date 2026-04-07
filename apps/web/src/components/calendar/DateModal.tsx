import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateModalProps, DateModalRef } from '@meditime/types';
import WeeklyEventContent from './WeeklyEventContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';

const DateModal = forwardRef<DateModalRef, DateModalProps>(({ 
  selectedDate,
  eventsForDay,
  onNext,
  onPrev,
  onSelectDate,
  getPastWeek,
  getNextWeek,
}, ref) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const modalDate = selectedDate ? new Date(selectedDate) : new Date();

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="shrink-0">
          <DialogTitle>
            <Calendar className="inline-block h-4 w-4 mr-2" />
            {modalDate.toLocaleDateString(t('locale'), {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('calendar.modal_description')}
          </DialogDescription>
        </DialogHeader>

        {/* 🔥 ZONE SCROLLABLE AVEC HAUTEUR RÉELLE */}
        <div className="flex-1 overflow-hidden">
          <WeeklyEventContent
            ifModal
            selectedDate={selectedDate}
            eventsForDay={eventsForDay}
            onSelectDate={onSelectDate}
            onNext={onNext}
            onPrev={onPrev}
            getPastWeek={getPastWeek}
            getNextWeek={getNextWeek}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

DateModal.displayName = 'DateModal';

export default DateModal;
