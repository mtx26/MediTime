import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import type { CalendarStockProps, StockDecrementMethod, StockMethodResult } from '@meditime/types';

export function useCalendarStock({ personalCalendars, setNotFound }: CalendarStockProps) {
  const { t } = useTranslation();
  const params = useParams<{ calendarId?: string }>();
  const calendarId = params.calendarId;

  const [selectedMethod, setSelectedMethod] = useState<StockDecrementMethod | ''>('');
  const [loading, setLoading] = useState<boolean | undefined>(undefined);

  const modifyStockDecrementMethod = async (method: StockDecrementMethod) => {
    if (!calendarId) return;
    const rep = await personalCalendars.updatePersonalStockDecrementMethod(calendarId, method);
    if (rep.success) {
      setSelectedMethod(method);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!calendarId) return;
      const rep = await personalCalendars.fetchPersonalStockDecrementMethod(calendarId) as StockMethodResult;
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

  return { selectedMethod, modifyStockDecrementMethod };
}
