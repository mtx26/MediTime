import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCodeScanner from '../../scanner/QRCodeScanner';
import { useNavigate, useParams } from 'react-router-dom';

const QRScanImport = forwardRef(({ calendarName, personalCalendars, onStateChange }, ref) => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { lng } = useParams();
  const scannerRef = useRef();

  // Exposer la référence du scanner au composant parent
  useImperativeHandle(ref, () => scannerRef.current);

  const handleCreateCalendar = async (medicines) => {

    setIsCreating(true);

    try {
      // Créer le calendrier
      const calendarResult = await personalCalendars.addCalendar(calendarName);
      
      if (!calendarResult.success) {
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
            medicine.name, // Nouvelle structure unifiée
            medicine.box_capacity, // boxCapacity
            medicine.stock_alert_threshold,
            medicine.stock_quantity, // stockQuantity
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
        setTimeout(() => {
          navigate(`/${lng}/calendar/${calendarId}/boxes`);
        }, 3000);
        return { success: true, successCount, errorCount };
      }

    } catch (error) {
      console.error('Erreur lors de la création:', error);
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
					<h5 className="mb-3 text-center">
						<i className="bi bi-qr-code-scan me-2"></i>
						{t('scanner.title')}
					</h5>         
					<QRCodeScanner
						ref={scannerRef}
						modal={false}
						onAddAll={handleCreateCalendar}
						singleScan={false}
						onStateChange={onStateChange}
					/>
				</div>
      </div>
    </div>
  );
});

export default QRScanImport;
