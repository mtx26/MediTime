import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRScanImport from '../../components/calendar/import/QRScanImport';
import ImageUploadImport from '../../components/calendar/import/ImageUploadImport';

function AddCalendarPage({ personalCalendars }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();

  const [newCalendarName, setNewCalendarName] = useState('');
  const [importType, setImportType] = useState('manual');
  
  // Refs pour les composants d'import
  const imageImportRef = useRef(null);
  const qrScanRef = useRef(null);
  
  // State pour l'état du composant d'import d'image
  const [imageImportState, setImageImportState] = useState({
    hasFile: false,
    isProcessing: false
  });

  const [qrScanState, setQrScanState] = useState({
    hasMedicine: false
  });

  const handleSubmit = async () => {
    if (importType === 'manual') {
      const rep = await personalCalendars.addCalendar(newCalendarName);
      if (rep.success) {
        navigate(`/${lng}/calendar/${rep.calendarId}/boxes`);
      }
    } else if (importType === 'qr' && qrScanRef.current) {
      qrScanRef.current.handleAddAll();
    } else if (importType === 'file' && imageImportRef.current) {
      imageImportRef.current.handleImport();
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card shadow">
        <div className="card-header text-center">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-calendar-plus me-2"></i>
            {t('calendar.add_calendar')}
          </h4>
        </div>

        <div className="card-body">
          {/* Form principal pour le nom du calendrier - toujours visible */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label htmlFor="newCalendarName" className="form-label">
                  {t('calendar.name')} <span className="text-danger">*</span>
                </label>
                <input
                  id="newCalendarName"
                  type="text"
                  className="form-control"
                  placeholder={t('calendar.name')}
                  required
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="importType" className="form-label">
                  {t('calendar.import_type')} <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="importType"
                  onChange={(e) => setImportType(e.target.value)}
                  value={importType}
                >
                  <option value="manual">{t('calendar.import_type_manual')}</option>
                  <option value="qr">{t('calendar.scan_qr_option')}</option>
                  <option value="file">{t('calendar.import_type_file')}</option>
                </select>
              </div>
            </div>

            {/* Mode manuel */}
            {importType === 'manual' && (
              <div>
                <div className="row mb-4">
                  <div className="col-12 d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                    >
                      <i className="bi bi-plus-lg me-2"></i>
                      {t('add')}
                    </button>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <div className="alert alert-info mt-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>
                        <div>
                          <strong>{t('calendar.import_type_manual')}</strong>
                          <p className="mb-0 small mt-1">
                            {t('calendar.import_type_manual_description')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Composants d'import pour QR et fichier */}
            {importType === 'qr' && (
              <>
                <QRScanImport
                  ref={qrScanRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setQrScanState}
                />
                
                {/* Bouton pour créer le calendrier avec les médicaments scannés */}
                <div className="row mt-4">
                  <div className="col-12 d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                      disabled={!qrScanState.hasMedicine}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      {t('add')}
                    </button>
                  </div>
                </div>
                
                {/* Alert explicative en dessous */}
                <div className="alert alert-success mt-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle me-3"></i>
                    <div>
                      <strong>{t('calendar.scan_qr_option')}</strong>
                      <p className="mb-0 small mt-1">
                        {t('calendar.import_type_qr_description')}
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
              </>
            )}
            {importType === 'file' && (
              <>
                <ImageUploadImport
                  ref={imageImportRef}
                  calendarName={newCalendarName}
                  personalCalendars={personalCalendars}
                  onStateChange={setImageImportState}
                />
                
                {/* Bouton d'import pour les fichiers */}
                <div className="row mt-4">
                  <div className="col-12 d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                      disabled={!imageImportState.hasFile || imageImportState.isProcessing}
                    >
                      <i className="bi bi-upload me-2"></i>
                      {t('add')}
                    </button>
                  </div>
                </div>

                {/* Alert explicative en dessous */}
                <div className="alert alert-warning mt-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle me-3"></i>
                    <div>
                      <strong>{t('calendar.import_type_file')}</strong>
                      <p className="mb-0 small mt-1">
                        {t('calendar.import_type_file_description')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCalendarPage;
