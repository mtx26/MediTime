import React, { useState, useEffect } from "react";
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRealtimeBoxesSwitcher } from '../../hooks/realtime/useRealtimeBoxesSwitcher';
import ActionSheet from '../../components/common/ActionSheet';

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
      box.stock_quantity <= box.stock_alert_threshold
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('loading_medicines')}</span>
        </div>
      </div>
    );
  }

  if (loadingBoxes === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="text-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {t('stock_alerts')}
        </h2>
        <ActionSheet
          dataTour="stock-alerts-actions-btn"
          actions={[
            {
              label: (
                <>
                  <i className="bi bi-pencil me-2"></i> {t('send_sms')}
                </>
              ),
              onClick: () => sendStockAlertsSMS(),
              title: t('send_sms'),
              dataTour: 'send-sms-btn',
            },
            {
              label: (
                <>
                  <i className="bi bi-calendar3 me-2" /> {t('ics.calendar_ics')}
                </>
              ),
              linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
              title: t('ics.calendar_ics'),
              dataTour: 'ics-calendar-btn',
            },
          ]}
        />

      </div>


      {alerts.length === 0 ? (
        <div className="alert alert-success" role="alert">
          {t('no_low_stock')}
        </div>
      ) : (
        <div className="row g-3">
          {alerts.map((med) => (
            <div key={med.id} className="col-12 col-lg-6">
              <div className={`card shadow h-100 ${med.stock_quantity <= 0 ? 'border-danger' : 'border-warning'}`}>
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="card-title mb-2">{med.name}</h5>
                    <p className="card-text text-muted mb-2">
                      {t('actual_stock')} : {med.stock_quantity} / {t('boxes.alert_threshold')} : {med.stock_alert_threshold}
                    </p>
                    <span
                      className={`badge ${
                        med.stock_quantity <= 0 ? 'bg-danger' : 'bg-warning text-dark'
                      }`}
                    >
                      {med.stock_quantity <= 0
                        ? t('critical_stock')
                        : t('low_stock')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-outline-success w-100"
                      onClick={() => restockBox(calendarId, med.id)}
                      aria-label={t('boxes.restock')}
                      title={t('boxes.restock')}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      {t('boxes.restock')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StockAlertsPage;
