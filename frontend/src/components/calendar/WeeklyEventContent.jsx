import React from 'react';
import ArrowControls from './ArrowControls';
import WeekDayCircles from './WeekDayCircles';
import { getMondayDate, toISO } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getPastWeek,
  getNextWeek,
}) {
  const { t, i18n } = useTranslation();
  // work with Date objects internally
  const selDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(getMondayDate(selDate));
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });
  const selIso = toISO(selDate);
  const weekIsos = weekDates.map((d) => toISO(d));
  const isFirstDay = weekIsos[0] === selIso;
  const isLastDay = weekIsos[6] === selIso;

  // Presentation: no expand/collapse state, always show details when present

  return (
    <>
      {/* Navigation arrows (kept for keyboard/assistive users) */}
      <ArrowControls onLeft={isFirstDay ? getPastWeek : onPrev} onRight={isLastDay ? getNextWeek : onNext} />

      {/* Week day selector (hidden in modal mode) */}
      <div className="mb-2 flex justify-center">
        <WeekDayCircles selectedDate={selDate} onSelectDate={onSelectDate} />
      </div>

      {/* Header: big date + prev/next tactile buttons */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={isFirstDay ? getPastWeek : onPrev}
          aria-label={t('previous_day')}
          title={t('previous_day')}
          className="min-w-10 px-1.5 py-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="text-center grow px-2">
          <div className="flex items-center justify-center">
            <div>
              <div className="text-muted-foreground text-xs capitalize">
                {selDate.toLocaleDateString(i18n.language || undefined, { weekday: 'long' })}
              </div>
              <div className="font-semibold text-base">
                {selDate.toLocaleDateString(i18n.language || undefined, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={isLastDay ? getNextWeek : onNext}
          aria-label={t('next_day')}
          title={t('next_day')}
          className="min-w-10 px-1.5 py-1"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

  {/* No expand/collapse control — show details by default */}

      {/* Events: card-style, mobile-first */}
      <div>
        {eventsForDay.length > 0 ? (
          <div className="grid gap-2">
            {eventsForDay.map((event, index) => {
              const time = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <Card
                  key={index}
                  role="group"
                  aria-label={`${event.title} ${time}`}
                  className="rounded-lg p-2.5"
                >
                  <div className="flex items-start">
                    <div className="w-16 shrink-0 mr-3">
                      <div
                        className="text-white px-2 py-1.5 rounded-md text-center font-semibold text-sm"
                        style={{ backgroundColor: event.color || '#6c757d' }}
                      >
                        {time}
                      </div>
                    </div>

                    <div className="grow">
                      <div className="font-semibold">
                        {event.title}
                      </div>
                      {event.dose != null && (
                        <div className="text-muted-foreground text-sm">{event.dose} mg</div>
                      )}
                      {event.notes && (
                        <div className="text-muted-foreground mt-1 text-sm">{event.notes}</div>
                      )}
                    </div>

                    <div className="ml-3 text-right">
                      <Badge variant="secondary" className="px-2 py-1.5">
                        {event.tablet_count}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center mb-0">{t('no_events_today')}</p>
        )}
      </div>
    </>
  );
}

WeeklyEventContent.propTypes = {
  ifModal: PropTypes.bool.isRequired,
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  getPastWeek: PropTypes.func.isRequired,
  getNextWeek: PropTypes.func.isRequired,
};
