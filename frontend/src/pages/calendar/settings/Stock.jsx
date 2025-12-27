import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const Stock = ({ personalCalendars }) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('');
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(undefined);

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  }

  const modifyStockDecrementMethod = async (method) => {
    const rep = await personalCalendars.updatePersonalStockDecrementMethod(calendarId, method);
    if (rep.success) {
      setSelectedMethod(method);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const rep = await personalCalendars.fetchPersonalStockDecrementMethod(calendarId);
      if (rep.success) {
        setSelectedMethod(rep.method);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    initialize();

  }, [calendarId, personalCalendars.fetchPersonalStockDecrementMethod, selectedMethod]);

  if (loading === undefined && calendarId) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="sr-only">{t('loading_calendar')}</span>
      </div>
    );
  }

  if (loading && calendarId) return null;

  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">{t('calendar_settings.stock.label')}</h5>
      <RadioGroup value={selectedMethod} onValueChange={modifyStockDecrementMethod} data-tour="settings-stock-methods" className="space-y-3">
        <label 
          htmlFor="weeklyPillbox" 
          className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer"
        >
          <RadioGroupItem value="weekly_pillbox" id="weeklyPillbox" className="mt-1" />
          <div className="flex-1">
            <div className="font-semibold">{t('calendar_settings.stock.weekly.label')}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('calendar_settings.stock.weekly.description')}
            </p>
          </div>
        </label>

        <label 
          htmlFor="dailyMidnight" 
          className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer"
        >
          <RadioGroupItem value="daily_midnight" id="dailyMidnight" className="mt-1" />
          <div className="flex-1">
            <div className="font-semibold">{t('calendar_settings.stock.daily.label')}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('calendar_settings.stock.daily.description')}
            </p>
          </div>
        </label>
      </RadioGroup>
    </div>
  );
};

export default Stock;
