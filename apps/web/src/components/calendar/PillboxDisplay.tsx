import { usePillboxData } from '@/hooks/calendar/usePillboxData';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { LoadingProvider } from '@/components/ui/loading';
import { DAYS, PILL_COUNT } from '@meditime/constants';
import type { PillboxContentProps } from '@meditime/types';

function PillboxContent(props: PillboxContentProps) {
  const {
    t, loading, weekDates, orderedMeds, selectedMedIndex,
    isPillboxUsed, pillboxError, setPillboxError,
    handleNextMed, handlePreviousMed, handleComplete,
  } = usePillboxData(props);

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
                    {DAYS.map((day, idx) => (
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
                                  src={`/icons/pills/${PILL_COUNT[orderedMeds[selectedMedIndex].cells[day] as keyof typeof PILL_COUNT]}_pills.svg`}
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
                        onClick={handleComplete}
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

export default function PillboxDisplay(props: PillboxContentProps) {
  return (
    <LoadingProvider name="pillbox" className="min-h-75">
      <PillboxContent {...props} />
    </LoadingProvider>
  );
}
