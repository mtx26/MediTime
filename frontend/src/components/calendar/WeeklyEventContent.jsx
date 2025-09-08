import React from 'react';
import ArrowControls from './ArrowControls';
import WeekDayCircles from './WeekDayCircles';
import { getMondayDate, formatToLocalISODate, toISO } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getPastWeek,
  getNextWeek,
  // optional: pass precomputed monday ISO string to avoid recomputing
  monday: mondayProp,
}) {
  const { t, i18n } = useTranslation();
  // work with Date objects internally
  const selDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  const mondayDate = mondayProp instanceof Date ? mondayProp : getMondayDate(selDate);
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });
  const selIso = toISO(selDate);
  const weekIsos = weekDates.map((d) => formatToLocalISODate(d));
  const isFirstDay = weekIsos[0] === selIso;
  const isLastDay = weekIsos[6] === selIso;

  // Presentation: no expand/collapse state, always show details when present

  return (
    <>
      {/* Navigation arrows (kept for keyboard/assistive users) */}
      <ArrowControls onLeft={isFirstDay ? getPastWeek : onPrev} onRight={isLastDay ? getNextWeek : onNext} />

      {/* Week day selector (hidden in modal mode) */}
      <div className="mb-2 d-flex justify-content-center">
        <WeekDayCircles selectedDate={selDate} onSelectDate={onSelectDate} monday={mondayDate} />
      </div>

      {/* Header: big date + prev/next tactile buttons */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={isFirstDay ? getPastWeek : onPrev}
          aria-label={t('previous_day')}
          title={t('previous_day')}
          style={{ minWidth: 40, padding: '0.25rem 0.35rem' }}
        >
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
        </button>

        <div className="text-center flex-grow-1 px-2">
          <div className="d-flex align-items-center justify-content-center">
            <div>
              <div className="text-muted" style={{ fontSize: 12, textTransform: 'capitalize' }}>
                {selDate.toLocaleDateString(i18n.language || undefined, { weekday: 'long' })}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {selDate.toLocaleDateString(i18n.language || undefined, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={isLastDay ? getNextWeek : onNext}
          aria-label={t('next_day')}
          title={t('next_day')}
          style={{ minWidth: 40, padding: '0.25rem 0.35rem' }}
        >
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>

  {/* No expand/collapse control — show details by default */}

      {/* Events: card-style, mobile-first */}
      <div>
        {eventsForDay.length > 0 ? (
          <div className="d-grid" style={{ gap: 8 }}>
            {eventsForDay.map((event, index) => {
              const time = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={index}
                  className="card"
                  role="group"
                  aria-label={`${event.title} ${time}`}
                  style={{ borderRadius: 8, padding: 10 }}
                >
                  <div className="d-flex align-items-start">
                    <div style={{ width: 64, flexShrink: 0 }} className="me-3">
                      <div
                        style={{
                          backgroundColor: event.color || '#6c757d',
                          color: 'white',
                          padding: '6px 8px',
                          borderRadius: 6,
                          textAlign: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {time}
                      </div>
                    </div>

                    <div className="flex-grow-1">
                      <div style={{ fontWeight: 600 }}>
                        {event.title}
                      </div>
                      {event.dose != null && (
                        <div className="text-muted" style={{ fontSize: 13 }}>{event.dose} mg</div>
                      )}
                      {event.notes && (
                        <div className="text-muted mt-1" style={{ fontSize: 13 }}>{event.notes}</div>
                      )}
                    </div>

                    <div style={{ marginLeft: 12 }} className="text-end">
                      <div className="badge bg-secondary" style={{ padding: '6px 8px' }}>
                        {event.tablet_count}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted text-center mb-0">{t('no_events_today')}</p>
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
  monday: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};
