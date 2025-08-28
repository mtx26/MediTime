import React from 'react';
import ArrowControls from './ArrowControls';
import WeekDayCircles from './WeekDayCircles';
import { getMondayFromDate, getWeekDaysISOStrings } from '../../utils/calendar/dateUtils';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
}) {
  const { t, i18n } = useTranslation();
  const monday = getMondayFromDate(selectedDate);
  const weekDays = getWeekDaysISOStrings(monday);
  const isFirstDay = weekDays[0] === selectedDate;
  const isLastDay = weekDays[6] === selectedDate;

  // Presentation: no expand/collapse state, always show details when present

  return (
    <>
      {/* Navigation arrows (kept for keyboard/assistive users) */}
      <ArrowControls onLeft={isFirstDay ? () => {} : onPrev} onRight={isLastDay ? () => {} : onNext} />

      {/* Week day selector (hidden in modal mode) */}
      <div className="mb-2 d-flex justify-content-center">
        <WeekDayCircles selectedDate={selectedDate} onSelectDate={onSelectDate} />
      </div>

      {/* Header: big date + prev/next tactile buttons */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={onPrev}
          disabled={isFirstDay}
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
                {new Date(selectedDate).toLocaleDateString(i18n.language || undefined, { weekday: 'long' })}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {new Date(selectedDate).toLocaleDateString(i18n.language || undefined, {
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
          onClick={onNext}
          disabled={isLastDay}
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
                      <div style={{ fontWeight: 600 }}>{event.title}</div>
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
  selectedDate: PropTypes.string.isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
};
