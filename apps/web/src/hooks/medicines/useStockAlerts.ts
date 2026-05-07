import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap, buildStockAlertActions, detectCalendarType, isStockAlertBox, isBoxMissingPillbox } from '@meditime/utils';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useLoading } from '@/components/ui/loading';
import type {
  CalendarBoxAlertItem,
  CalendarStockAlertsSource,
  StockAlertsPageProps,
} from '@meditime/types';

export function useStockAlerts({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: StockAlertsPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lng } = params;
  const { showLoading } = useLoading();

  const [boxes, setBoxes] = useState<CalendarBoxAlertItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const [rep, setRep] = useState<Response | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as CalendarStockAlertsSource;

  // --- MOCK DEMO START ---
  useEffect(() => {
    if (calendarId === 'demo') {
      setBoxes([
        {
          id: 'demo-box-1',
          name: 'Doliprane',
          dose: 1000,
          stock_quantity: 2,
          stock_alert_threshold: 5,
          box_capacity: 10,
        },
        {
          id: 'demo-box-2',
          name: 'Vitamin C',
          dose: 500,
          stock_quantity: 0,
          stock_alert_threshold: 3,
          box_capacity: 20,
        }
      ]);
      setLoadingBoxes(true);
    }
  }, [calendarId]);
  // --- MOCK DEMO END ---

  const isDemo = calendarId === 'demo';
  useRealtimeBoxesSwitcher(
    isDemo ? 'token' : calendarType,
    calendarId ?? null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );

  useEffect(() => {
    if (rep && rep.status === 404) {
      setNotFound(true);
      setLoadingBoxes(false);
    }
  }, [rep]);

  const alerts = useMemo(() =>
    boxes.filter(isStockAlertBox), [boxes]);

  const restockBox = (boxId: string) => {
    void calendarSource.restockBox(calendarId, boxId);
  };

  const sendStockAlertsSMS = () => {
    const title = t('boxes.stock.alerts.title');
    const message =
      title +
      '\n' +
      alerts
        .map(box => {
          if (isBoxMissingPillbox(box)) {
            return t('boxes.stock.alerts.line_negative', {
              name: box.name,
              dose: box.dose,
              count: box.stock_quantity
            });
          }
          return t('boxes.stock.alerts.line', {
            name: box.name,
            dose: box.dose,
            count: box.stock_quantity
          });
        })
        .join('\n');

    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:?&body=${encodedMessage}`;
  };

  const navigateToMissingPillbox = (medId: string) => {
    const medsIdParam = encodeURIComponent(JSON.stringify([medId]));
    navigate(`/${lng}/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}`);
  };

  const actionSheetActions = buildStockAlertActions(
    { calendarId: calendarId!, lng: lng!, basePath },
    { onSendSms: sendStockAlertsSMS },
  );

  useEffect(() => {
    showLoading(Boolean(loadingBoxes === undefined), t('boxes.loading_stock_alerts'));
  }, [loadingBoxes, showLoading, t]);

  return {
    loadingBoxes,
    notFound,
    alerts,
    restockBox,
    navigateToMissingPillbox,
    actionSheetActions,
  };
}
