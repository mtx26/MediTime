import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCodeScanner from '../../scanner/QRCodeScanner';
import { useNavigate, useParams } from 'react-router-dom';

function QRScanImport({ calendarName, personalCalendars, setError }) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { lng } = useParams();

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

  if (isCreating) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center"
        style={{ flexGrow: 1, minHeight: '40vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('calendar.creating_calendar')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
		<hr/>
      <div className="col-12">
        <div>
          <div>
            <h5 className="mb-3 text-center">
              <i className="bi bi-qr-code-scan me-2"></i>
              {t('scanner.title')}
            </h5>         
            <QRCodeScanner
              modal={false}
              onAddAll={handleCreateCalendar}
              singleScan={true}
            />
          </div>
        </div>

        {/* Alert explicative en dessous */}
        <div className="alert alert-success mt-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle me-3"></i>
            <div>
              <strong>{t('calendar.import_type_qr_description')}</strong>
              <p className="mb-0 small mt-1">
                Scannez les codes QR de vos médicaments pour créer automatiquement votre calendrier avec toutes les informations nécessaires.
              </p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <img 
              src="/icons/datamatrix.webp" 
              alt="Data Matrix QR Code" 
              className="img-fluid"
              style={{ maxHeight: '160px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRScanImport;
