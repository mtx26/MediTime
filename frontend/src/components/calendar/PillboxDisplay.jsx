import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { getMondayDate, toISO } from '../../utils/calendar/dateUtils';
import AlertSystem from '../common/AlertSystem';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pill_count = {
  0.25: '0.25',
  0.5: '0.50',
  0.75: '0.75',
  1: '1.00',
};

export default function PillboxDisplay({
  type,
  selectedDate,
  calendarType,
  calendarId,
  basePath,
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const [calendarTable, setCalendarTable] = useState([]);
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState([]);
  const [loading, setLoading] = useState(undefined);
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [isPillboxUsed, setIsPillboxUsed] = useState(false); // Indicateur d'utilisation de la boîte à pilules
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pillboxError, setPillboxError] = useState(false);

  // Calculer les dates de la semaine à partir du lundi fourni
  const weekDates = React.useMemo(() => {
    if (!selectedDate) return [];
    const base = new Date(getMondayDate(selectedDate));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  const handleNextMed = () => {
    setSelectedMedIndex((prev) => (prev + 1 < orderedMeds.length ? prev + 1 : prev));
  };

  const handlePreviousMed = () => {
    setSelectedMedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(undefined);
      const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate));
      if (rep.success && !isEqual(rep.table, calendarTable)) {
        setCalendarTable(rep.table);
      }
      setLoading(rep.success);
    };

    if (!calendarId) return;
    if ((calendarType === 'sharedUser' || calendarType === 'personal') && !userInfo) return;

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo, selectedDate]);

  useEffect(() => {
    const time_order = ['morning', 'noon', 'evening'];
    const allMeds = time_order.flatMap((moment) => {
      const meds = calendarTable[moment] || [];
      return meds
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((med) => ({ ...med, moment }));
    });
    setOrderedMeds(allMeds);
    setSelectedMedIndex(0);
  }, [calendarTable]);

  // Get if pillbox is used
  useEffect(() => {
    const fetchPillboxUsage = async () => {
      if (!calendarId) return;
      if (!selectedDate) return
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return;
      }
      const rep = await calendarSource.fetchIfPillboxUsed(calendarId, toISO(selectedDate));
      if (rep.success) {
        setIsPillboxUsed(rep.if_pillbox_used);
      }
    };

    fetchPillboxUsage();
  }, [calendarId, calendarType, calendarSource.fetchIfPillboxUsed, selectedDate, userInfo]);

  if (loading === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '40vh' }}>
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_calendar')}</span>
        </div>
      </div>
    );
  }

  if (loading === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <div className="position-relative">
      {showConfirmation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
        >
          <AlertSystem
            message={message}
            type={alertType}
            onClose={() => {
              setMessage('');
              setAlertType('');
              setShowConfirmation(false);
            }}
            onConfirm={async() => {
              const rep = await calendarSource.decreaseStock(calendarId, toISO(selectedDate));

              // Navigation propre au pillbox (effectuée même si rep.success est false, comme avant)
              if (type === 'pillbox') {
                navigate(`/${lng}/${basePath}/${calendarId}`);
              }

              if (rep.success) {
                const rep2 = await calendarSource.fetchIfPillboxUsed(calendarId, toISO(selectedDate));
                setIsPillboxUsed(rep2.if_pillbox_used);
              } else {
                setPillboxError(true);
              }
              setShowConfirmation(false);
            }}
          />
        </div>
      )}

      <div className="container-fluid text-center w-100 mt-3">
        {isPillboxUsed ? (
          <div className="mb-3 p-3">
            <div className="d-flex align-items-center justify-content-center">
              <i className="bi bi-check-circle-fill text-success fs-2 me-3 animate__animated animate__pulse"></i>
              <span className="fs-5 fw-bold">{t('calendar_completed_this_week')}</span>
            </div>
          </div>
        ) : (
          <>
            {pillboxError ? (
              <div className="mb-3 p-3">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-2 me-3"></i>
                  <span className="fs-5">{t('pillbox_error_message')}</span>
                  <button 
                    className='btn btn-sm border-0 bg-transparent d-flex align-items-center gap-2 px-0'
                    onClick={() => setPillboxError(false)}
                    aria-label={t('retry')}
                    title={t('retry')}
                  >
                    <span className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-arrow-clockwise fs-4 text-danger"></i>
                    </span>
                    <span className="text-danger fw-bold">{t('retry')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {orderedMeds.length > 0 && (
                  <>
                    <div 
                      className={
                        `rounded-top px-3 py-2 ${
                        orderedMeds[selectedMedIndex].moment === 'morning' ? 'bg-danger text-white' :
                        orderedMeds[selectedMedIndex].moment === 'noon' ? 'bg-success text-white' :
                        orderedMeds[selectedMedIndex].moment === 'evening' ? 'bg-info text-white' :
                        'bg-white text-primary'}`
                      }
                    >
                      <h4 className="mb-0"><strong>{t(orderedMeds[selectedMedIndex].moment)}</strong></h4>
                    </div>
                    <div className="bg-primary text-white px-3 py-3 rounded-bottom mb-4">
                      <h4 className="mb-0"><strong>{orderedMeds[selectedMedIndex].title}</strong></h4>
                    </div>
                    <div className="row row-cols-7 g-3 align-items-stretch text-center">
                      {days.map((day, idx) => (
                        <div key={day} className="col">
                          <div className="d-flex flex-column h-100">
                            <h6 className="mb-1">{t(day)}</h6>
                            <div className='text-secondary rounded mb-2' >
                              {weekDates[idx] && (
                                weekDates[idx].toLocaleDateString(t('locale'), {
                                  month: 'numeric',
                                  day: 'numeric',
                                })
                              )}
                            </div>
                            <div className="shadow-sm border rounded bg-light p-2 flex-grow-1 d-flex align-items-center justify-content-center">
                              {orderedMeds[selectedMedIndex].cells[day] !== undefined && (
                                <div className="w-100 ratio ratio-1x1">
                                  <img
                                    src={`/icons/pills/${pill_count[orderedMeds[selectedMedIndex].cells[day]]}_pills.svg`}
                                    alt="Pills"
                                    className="img-fluid object-fit-contain"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex gap-3 justify-content-between text-center">
                      <button 
                        className="btn btn-outline-primary mt-4" 
                        onClick={handlePreviousMed} 
                        disabled={selectedMedIndex === 0}
                        aria-label={t('previous')}
                        title={t('previous')}
                      >
                        <i className="bi bi-arrow-left"></i> {t('previous')}
                      </button>
                      {selectedMedIndex < orderedMeds.length - 1 ? (
                        (() => {
                          const currentMoment = orderedMeds[selectedMedIndex].moment;
                          const nextMoment = orderedMeds[selectedMedIndex + 1].moment;

                          if (currentMoment === nextMoment) {
                            return (
                              <button 
                                className="btn btn-outline-primary mt-4" 
                                onClick={handleNextMed}
                                aria-label={t('next')}
                                title={t('next')}
                              >
                                {t('next')} <i className="bi bi-arrow-right"></i>
                              </button>
                            );
                          } else {
                            return (
                              <button
                                className={`btn ${
                                  nextMoment === 'morning' ? 'btn-danger text-white' :
                                  nextMoment === 'noon' ? 'btn-success text-white' :
                                  nextMoment === 'evening' ? 'btn-info text-white' :
                                  'btn-primary text-white'
                                } mt-4`} 
                                onClick={handleNextMed}
                                aria-label={t('next')}
                                title={t('next')}
                              >
                                {t(nextMoment)} <i className="bi bi-arrow-right"></i>
                              </button>
                            );
                          }
                        })()
                      ) : (
                        <button
                          className="btn btn-success mt-4"
                          onClick={() => {
                            setMessage(t('confirm_calendar_completion'));
                            setAlertType('confirm-safe');
                            setShowConfirmation(true);
                            
                          }}
                          aria-label={t('done')}
                          title={t('done')}
                        >
                          <i className="bi bi-check-circle"></i> {t('done')}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {orderedMeds.length === 0 && <p className="mt-5">{t('no_medicines')}</p>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
