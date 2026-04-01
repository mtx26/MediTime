import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type { CalendarStockProps } from '@meditime/types';


const Stock = ({ personalCalendars, setNotFound }: CalendarStockProps) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState('');
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean | undefined>(undefined);

  let calendarId = params.calendarId;

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
    calendarId = params.calendarId;
  }

  const modifyStockDecrementMethod = async (method: string) => {
    const rep = await personalCalendars.updatePersonalStockDecrementMethod(calendarId, method);
    if (rep.success) {
      setSelectedMethod(method);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const rep = await personalCalendars.fetchPersonalStockDecrementMethod(calendarId);
      if (rep.success) {
        setSelectedMethod(rep.method ?? '');
        setLoading(false);
      } else {
        if (rep.status === 404) {
          setNotFound(true);
        }
        setLoading(false);
      }
    };
    void initialize();

  }, [calendarId, personalCalendars, selectedMethod, setNotFound]);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(loading === undefined && calendarId), t('calendar_settings.loading_stock_settings'));
  }, [loading, calendarId, showLoading, t]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>{t('calendar_settings.stock.label')}</CardTitle>
        </div>
        <CardDescription>{t('calendar_settings.stock.description')}</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default Stock;
