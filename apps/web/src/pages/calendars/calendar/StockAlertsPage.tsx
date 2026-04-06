import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { getCalendarSourceMap, buildStockAlertActions, detectCalendarType } from '@meditime/utils';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import ActionSheet from '@/components/common/ActionSheet';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import IconButton from '@/components/common/UtilityComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, PlusCircle, Package } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import type {
  CalendarBoxAlertItem,
  CalendarStockAlertsSource,
  StockAlertsPageProps,
} from '@meditime/types';

function StockAlertsPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: StockAlertsPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lng } = params;

  const [boxes, setBoxes] = useState<CalendarBoxAlertItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const [rep, setRep] = useState<any>(null);
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
  // Hook en temps réel
  useRealtimeBoxesSwitcher(
    isDemo ? 'token' : calendarType,
    calendarId ?? null,
    setBoxes as unknown as Dispatch<SetStateAction<{ name: string; [key: string]: unknown }[]>>,
    setLoadingBoxes,
    setRep
  );

  useEffect(() => {
    if (rep && rep.status === 404) {
      setNotFound(true);
      setLoadingBoxes(false);
    }
  }, [rep]);

  // On filtre les boîtes qui sont en stock faible
  const alerts = boxes.filter(
    (box) =>
      box.stock_alert_threshold > 0 &&
      box.stock_quantity <= box.stock_alert_threshold &&
      box.box_capacity > 0 &&
      box.conditions?.every((c) => {
        if (!c?.max_date) return true;
        const now = new Date();
        const maxDate = new Date(c.max_date);
        return now <= maxDate;
      })
  );

  const restockBox = (currentCalendarId: string | undefined, boxId: string) => {
    void calendarSource.restockBox(currentCalendarId, boxId);
  };

  const sendStockAlertsSMS = () => {
  const title = t('boxes.stock.alerts.title');
  const message =
    title +
    '\n' +
    alerts
      .map(box => {
        if (box.stock_quantity < 0) {
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

  const { showLoading } = useLoading();

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(Boolean(loadingBoxes === undefined), t('boxes.loading_stock_alerts'));
  }, [loadingBoxes, showLoading, t]);

  if (loadingBoxes === undefined) {
    return null;
  }

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />        
          <h4 className="text-xl font-bold">
            {t('stock_alerts')}
          </h4>
        </div>
        <ActionSheet
          dataTour="stock-alerts-actions-btn"
          actions={toActionSheetItems(
            buildStockAlertActions(
              { calendarId: calendarId!, lng: lng!, basePath },
              { onSendSms: () => sendStockAlertsSMS() },
            ),
            t,
          )}
        />
      </div>

      {alerts.length === 0 ? (
        <Alert className="max-w-150">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{t('no_low_stock')}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {alerts.map((med) => (
            <Card
              key={med.id}
              className={med.stock_quantity <= 0 ? 'border-destructive' : 'border-amber-500'}
            >
              <CardContent className="flex flex-col justify-between h-full">
                <div>
                  <h5 className="font-semibold mb-4 text-lg">
                    {med.name} ({med.dose} mg)
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <small className="block text-muted-foreground mb-1">
                        {t('boxes.capacity')}
                      </small>
                      <strong>{med.box_capacity}</strong>
                    </div>
                    <div>
                      <small className="block text-muted-foreground mb-1">
                        {t('boxes.alert_threshold')}
                      </small>
                      <strong>{med.stock_alert_threshold}</strong>
                    </div>
                    <div>
                      <small className="block text-muted-foreground mb-1">
                        {t('actual_stock')}
                      </small>
                      <strong className={med.stock_quantity <= 0 ? 'text-destructive' : ''}>
                        {med.stock_quantity}
                      </strong>
                    </div>
                    <div className='flex-1 flex flex-col gap-2'>
                      <div className="flex-1">
                        <IconButton
                          className="w-full border-green-500 text-green-600 hover:bg-green-50"
                          icon={PlusCircle}
                          text={t('boxes.restock')}
                          onClick={() => restockBox(calendarId, med.id)}
                          disabled={med.box_capacity === 0}
                          helpDisabled={t('boxes.restock_disabled_tooltip')}
                        />
                      </div>
                      {/* Bouton pour faire le pillulier d'un medoc negatif */}
                      {med.stock_quantity < 0 && (
                        <div className='flex-1'>
                          <IconButton
                            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                            icon={Package}
                            text={t('boxes.missing_pillbox')}
                            onClick={() => {
                              const medsIdParam = encodeURIComponent(JSON.stringify([med.id]));
                              navigate(`/${lng}/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}`);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={med.stock_quantity <= 0
                      ? 'bg-red-500/15 text-foreground border-red-500/50'
                      : 'bg-yellow-500/15 text-foreground border-yellow-500/50'}
                  >
                    {med.stock_quantity <= 0
                      ? t('critical_stock')
                      : t('low_stock')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default StockAlertsPage;
