import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCodeScanner from '../../components/scanner/QRCodeScanner';

function AddCalendarQRPage({ personalCalendars }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  
  const [calendarName, setCalendarName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Récupérer le nom du calendrier depuis l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name) {
      setCalendarName(decodeURIComponent(name));
    }
  }, []);

  const handleCreateCalendar = async (medicines) => {
    if (!calendarName.trim()) {
      setError(t('calendar.error_no_calendar_name'));
      return { success: false };
    }

    if (!medicines || medicines.length === 0) {
      setError(t('calendar.error_no_medicines'));
      return { success: false };
    }

    setIsCreating(true);
    setError('');

    try {
      // Créer le calendrier
      const calendarResult = await personalCalendars.addCalendar(calendarName);
      
      if (!calendarResult.success) {
        setError('❌ ' + t('calendar.error_calendar_creation') + ': ' + calendarResult.error);
        return { success: false };
      }

      const calendarId = calendarResult.calendarId;

      // Ajouter chaque médicament comme une boîte
      let successCount = 0;
      let errorCount = 0;

      for (const medicine of medicines) {
        try {
          const boxResult = await personalCalendars.createPersonalBox(
            calendarId,
            medicine.medicine.name,
            medicine.conditionnement, // boxCapacity
            medicine.stockAlertThreshold,
            medicine.conditionnement, // stockQuantity
            medicine.dose // dose
          );

          if (boxResult.success) {
            successCount++;
          } else {
            errorCount++;
            console.error('Erreur création boîte:', boxResult.error);
          }
        } catch (error) {
          errorCount++;
          console.error('Erreur lors de la création de boîte:', error);
        }
      }

      if (errorCount === 0) {
        // Succès total - naviguer vers le calendrier créé
        navigate(`/${lng}/calendar/${calendarId}/boxes`);
        return { success: true, successCount, errorCount };
      } else {
        // Succès partiel ou échec
        setError(t('calendar.error_partial_success', { count: errorCount }));
        setTimeout(() => {
          navigate(`/${lng}/calendar/${calendarId}/boxes`);
        }, 3000);
        return { success: true, successCount, errorCount };
      }

    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError('❌ ' + t('calendar.error_calendar_creation'));
      return { success: false };
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card shadow">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0 fw-bold">
              <i className="bi bi-qr-code-scan me-2"></i>
              {t('calendar.add_with_qr')}
            </h4>
          </div>
        </div>
        {isCreating ? (
          <div 
            className="d-flex justify-content-center align-items-center"
            style={{ flexGrow: 1, minHeight: '60vh' }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('calendar.creating_calendar')}</span>
            </div>
          </div>
        ) : (
          <div className="card-body">
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="calendarName" className="form-label fw-bold">
                {t('calendar.calendar_name')}
              </label>
              <input
                id="calendarName"
                type="text"
                className="form-control"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder={t('calendar.calendar_name_placeholder')}
                required
                disabled={isCreating}
              />
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-3">{t('calendar.scan_medicines')}</h6>
              <p className="text-muted small mb-3">
                {t('calendar.scan_medicines_description')}
              </p>
              
              <QRCodeScanner
                modal={false}
                onAddAll={handleCreateCalendar}
                onClose={() => navigate(`/${lng}/calendars`)}
                singleScan={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddCalendarQRPage;
