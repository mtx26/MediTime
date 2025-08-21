import React, { useState } from 'react';
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
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCalendarName.trim()) return;

    if (importType === 'manual') {
      const rep = await personalCalendars.addCalendar(newCalendarName);
      if (rep.success) {
        navigate(`/${lng}/calendar/${rep.calendarId}/boxes`);
      } else {
        setError('❌ ' + rep.error);
      }
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
          <form onSubmit={handleSubmit}>
            {/* Première ligne: Nom du calendrier et type d'import */}
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label htmlFor="newCalendarName" className="form-label">
                  {t('calendar.name')}
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
                  {t('calendar.import_type')}
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

            {/* Bouton pour mode manuel uniquement */}
            {importType === 'manual' && (
              <div className="row mb-4">
                <div className="col-12 d-flex justify-content-center">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-5"
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    {t('add')}
                  </button>
                </div>
              </div>
            )}

            {/* Messages d'erreur pour mode manuel uniquement */}
            {importType === 'manual' && error && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Description pour mode manuel */}
            {importType === 'manual' && (
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('calendar.import_type_manual_description')}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Composants d'import pour QR et fichier - en dehors du form */}
          {importType === 'qr' && (
            <QRScanImport
              calendarName={newCalendarName}
              personalCalendars={personalCalendars}
              setError={setError}
            />
          )}
          {importType === 'file' && (
            <ImageUploadImport
              calendarName={newCalendarName}
              personalCalendars={personalCalendars}
            />
          )}

          {/* Messages d'erreur en bas pour les imports QR et fichier */}
          {(importType === 'qr' || importType === 'file') && error && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddCalendarPage;
