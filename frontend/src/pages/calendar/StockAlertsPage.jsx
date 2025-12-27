import React, { useState, useEffect } from "react";
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRealtimeBoxesSwitcher } from '../../hooks/realtime/useRealtimeBoxesSwitcher';
import ActionSheet from '../../components/common/ActionSheet';
import IconButton from '../../components/common/UtilityComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Pencil, Calendar, PlusCircle } from 'lucide-react';

function StockAlertsPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  const params = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { lng } = params;

  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  // --- MOCK DEMO START ---
  useEffect(() => {
    if (calendarId === 'demo') {
      setBoxes([
        {
          id: 'demo-box-1',
          name: 'Doliprane',
          dose: '1000 mg',
          stock_quantity: 2,
          stock_alert_threshold: 5,
          box_capacity: 10,
        },
        {
          id: 'demo-box-2',
          name: 'Vitamin C',
          dose: '500 mg',
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
    isDemo ? null : calendarType,
    calendarId,
    setBoxes,
    isDemo ? () => { /* no-op */ } : setLoadingBoxes
  );

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

  const restockBox = (calendarId, boxId) => {
    calendarSource.restockBox(calendarId, boxId)
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

  if (loadingBoxes === undefined) {
    return (
      <div className="flex justify-center items-center" style={{ height: '60vh' }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadingBoxes === false) {
    return (
      <div className="flex justify-center mt-5">
        <Alert variant="destructive" className="max-w-150">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{t('invalid_or_expired_link')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />        
          <h4 className="text-xl font-bold">
            {t('stock_alerts')}
          </h4>
        </div>
        <ActionSheet
          dataTour="stock-alerts-actions-btn"
          actions={[
            {
              label: (
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  {t('send_sms')}
                </div>
              ),
              onClick: () => sendStockAlertsSMS(),
              title: t('send_sms'),
              dataTour: 'send-sms-btn',
            },
            {
              label: (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('ics.calendar_ics')}
                </div>
              ),
              linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
              title: t('ics.calendar_ics'),
              dataTour: 'ics-calendar-btn',
            },
          ]}
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
                    <div>
                      <IconButton
                        className="w-full border-green-500 text-green-600 hover:bg-green-50"
                        icon={PlusCircle}
                        text={t('boxes.restock')}
                        onClick={() => restockBox(calendarId, med.id)}
                        disabled={med.box_capacity === 0}
                        helpDisabled={t('boxes.restock_disabled_tooltip')}
                      />
                    </div>
                  </div>
                  <Badge
                    variant={med.stock_quantity <= 0 ? 'destructive' : ''}
                    className={med.stock_quantity > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
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
  );
}

export default StockAlertsPage;
