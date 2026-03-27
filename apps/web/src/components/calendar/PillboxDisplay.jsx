import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useParams,  useSearchParams} from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { UserContext } from '../../contexts/UserContext';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { getMondayDate, toISO } from '../../utils/calendar/dateUtils';
import { useAlert } from '../../contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { LoadingProvider } from '@/components/ui/loading';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pill_count = {
  0.25: '0.25',
  0.5: '0.50',
  0.75: '0.75',
  1: '1.00',
};

function PillboxContent({
  type,
  selectedDate,
  calendarType,
  calendarId,
  basePath,
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
  setNotFound,
}) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const { lng } = useParams();
  const [searchParams] = useSearchParams();

  const medsIdParam = searchParams.get('medsId');
  const medsId = React.useMemo(() => 
    medsIdParam ? JSON.parse(decodeURIComponent(medsIdParam)) : [], 
    [medsIdParam]
  );

  const [calendarTable, setCalendarTable] = useState([]);
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState([]);
  const [loading, setLoading] = useState(undefined);
  const { showConfirm } = useAlert();
  const [isPillboxUsed, setIsPillboxUsed] = useState(false);
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

  const getSchedule = async () => {
    setLoading(undefined);
    const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate));
    if (rep.success && !isEqual(rep.table, calendarTable)) {
      setCalendarTable(rep.table);
    } else if (rep.status === 404) {
      setNotFound(true);
    }
    setLoading(rep.success);
  };

  const getScheduleNegativeStock = async () => {
    setLoading(undefined);
    const rep = await calendarSource.fetchScheduleNegativeStock(calendarId, medsId);
    if (rep.success && !isEqual(rep.table, calendarTable)) {
      setCalendarTable(rep.table);
    } else if (rep.status === 404) {
      setNotFound(true);
    }
    setLoading(rep.success);
  };

  useEffect(() => {
    if (!calendarId) return;
    if ((calendarType === 'sharedUser' || calendarType === 'personal') && !userInfo) return;

    if (medsId.length === 0) {
      getSchedule();
    } else {
      getScheduleNegativeStock();
    }

  }, [calendarId, calendarSource.fetchSchedule, calendarSource.fetchScheduleNegativeStock, userInfo, selectedDate, medsId]);

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

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loading === undefined, t('loading_pillbox'), 'pillbox');
  }, [loading, showLoading, t]);

  if (loading === undefined) {
    return null;
  }

  if (loading === false) {
    return (
      <div className="mt-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription className="text-center">
            {t('invalid_or_expired_link')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto text-center w-full">
      {isPillboxUsed ? (
        <div className="p-3">
          <div className="flex flex-col justify-center items-center p-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <span className="text-green-600 font-bold mt-2 mb-0 text-center">{t('calendar_completed_this_week')}</span>
          </div>
        </div>
      ) : (
        <>
          {pillboxError ? (
            <div className="flex flex-col justify-center items-center p-4">
              <Alert variant="destructive" className="w-full max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>
                  {t('pillbox_error_message')}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setPillboxError(false)}
                aria-label={t('retry')}
                title={t('retry')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('retry')}
              </Button>
            </div>
          ) : (
            <>
              {orderedMeds.length > 0 && (
                <>
                  <div 
                    className={
                      `rounded-t-lg px-3 py-2 ${
                      orderedMeds[selectedMedIndex].moment === 'morning' ? 'bg-red-500 text-white' :
                      orderedMeds[selectedMedIndex].moment === 'noon' ? 'bg-green-500 text-white' :
                      orderedMeds[selectedMedIndex].moment === 'evening' ? 'bg-blue-400 text-white' :
                      'bg-white text-primary'}`
                    }
                  >
                    <h4 className="mb-0 text-lg font-bold">{t(orderedMeds[selectedMedIndex].moment)}</h4>
                  </div>
                  <div className="bg-primary text-primary-foreground px-3 py-3 rounded-b-lg mb-6">
                    <h4 className="mb-0 text-lg font-bold">{orderedMeds[selectedMedIndex].title}</h4>
                  </div>
                  <div className="grid grid-cols-7 gap-3 items-stretch text-center">
                    {days.map((day, idx) => (
                      <div key={day} className="flex flex-col">
                        <div className="flex flex-col h-full">
                          <h6 className="mb-1 text-sm font-semibold">{t(day)}</h6>
                          <div className='text-muted-foreground rounded mb-2 text-sm' >
                            {weekDates[idx] && (
                              weekDates[idx].toLocaleDateString(t('locale'), {
                                month: 'numeric',
                                day: 'numeric',
                              })
                            )}
                          </div>
                          <div className="shadow-sm border rounded bg-muted/20 p-2 w-full h-full flex items-center justify-center">
                            {orderedMeds[selectedMedIndex].cells[day] !== undefined && (
                              <div className="w-full aspect-square">
                                <img
                                  src={`/icons/pills/${pill_count[orderedMeds[selectedMedIndex].cells[day]]}_pills.svg`}
                                  alt="Pills"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-between text-center">
                    <Button 
                      variant="outline"
                      className="mt-4"
                      onClick={handlePreviousMed} 
                      disabled={selectedMedIndex === 0}
                      aria-label={t('previous')}
                      title={t('previous')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> {t('previous')}
                    </Button>
                    {selectedMedIndex < orderedMeds.length - 1 ? (
                      (() => {
                        const currentMoment = orderedMeds[selectedMedIndex].moment;
                        const nextMoment = orderedMeds[selectedMedIndex + 1].moment;

                        if (currentMoment === nextMoment) {
                          return (
                            <Button 
                              variant="outline"
                              className="mt-4"
                              onClick={handleNextMed}
                              aria-label={t('next')}
                              title={t('next')}
                            >
                              {t('next')} <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          );
                        } else {
                          return (
                            <Button
                              className={`${
                                nextMoment === 'morning' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                nextMoment === 'noon' ? 'bg-green-500 hover:bg-green-600 text-white' :
                                nextMoment === 'evening' ? 'bg-blue-400 hover:bg-blue-500 text-white' :
                                'bg-primary hover:bg-primary/90 text-primary-foreground'
                              } mt-4`}
                              onClick={handleNextMed}
                              aria-label={t('next')}
                              title={t('next')}
                            >
                              {t(nextMoment)} <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          );
                        }
                      })()
                    ) : (
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white mt-4"
                        onClick={() => {
                          showConfirm(
                            'confirm-safe',
                            medsId.length === 0
                              ? t('confirm_calendar_completion')
                              : t('confirm_calendar_refill'),
                            medsId.length === 0
                              ? t('pillbox_completion_description')
                              : t('pillbox_refill_description'),
                            async () => {
                              if (medsId.length === 0) {
                                const rep = await calendarSource.decreaseStock(calendarId, toISO(selectedDate));
                                if (!rep.success) {
                                  setPillboxError(true);
                                }
                                // Navigation propre au pillbox (effectuée même si rep.success est false, comme avant)
                                if (type === 'pillbox') {
                                  navigate(`/${lng}/${basePath}/${calendarId}`);
                                }
                              } else {
                                for (const medId of medsId) {
                                  const rep = await calendarSource.restockBox(calendarId, medId);
                                  if (!rep.success) {
                                    setPillboxError(true);
                                    break;
                                  }
                                }
                                // Navigation propre au pillbox (effectuée même si rep.success est false, comme avant)
                                if (type === 'pillbox') {
                                  navigate(`/${lng}/${basePath}/${calendarId}/boxes`);
                                }
                              }
                            }
                          );
                        }}
                        aria-label={t('done')}
                        title={t('done')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> {t('done')}
                      </Button>
                    )}
                  </div>
                </>
              )}
              {orderedMeds.length === 0 && <p className="mt-8 text-muted-foreground">{t('no_medicines')}</p>}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function PillboxDisplay(props) {
  return (
    <LoadingProvider name="pillbox" className="min-h-75">
      <PillboxContent {...props} />
    </LoadingProvider>
  );
}
