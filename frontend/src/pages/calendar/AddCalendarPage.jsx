import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function AddCalendarPage({ personalCalendars }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [newCalendarName, setNewCalendarName] = useState('');
  const [importType, setImportType] = useState('manual');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCalendarName.trim()) return;

    if (importType === 'manual') {
      const rep = await personalCalendars.addCalendar(newCalendarName);
      if (rep.success) {
        navigate('/calendar/' + rep.calendarId + '/boxes');
      } else {
        alert('❌ ' + rep.error);
      }
    } else if (importType === 'file') {
      navigate('/add-calendar/import?name=' + encodeURIComponent(newCalendarName));
    }
  };

  return (
    <div className="container card shadow p-0" style={{ maxWidth: '800px' }}>
      <h4 className="mb-4 fw-bold text-center mt-4">
        <i className="bi bi-calendar-plus me-2"></i>
        {t('calendar.add_calendar')}
      </h4>

      <form onSubmit={handleSubmit}>
        <div className="row g-2 align-items-center mb-4 card-body">
          <div className="col-md-6">
            <input
              id="newCalendarName"
              aria-label={t('calendar.name')}
              title={t('calendar.name')}
              type="text"
              className="form-control"
              placeholder={t('calendar.name')}
              required
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              aria-label={t('calendar.import_type')}
              title={t('calendar.import_type')}
              id="importType"
              onChange={(e) => setImportType(e.target.value)}
              value={importType}
            >
              <option value="manual">{t('calendar.import_type_manual')}</option>
              <option value="file">{t('calendar.import_type_file')}</option>
            </select>
          </div>

          <div className="col-md-2">
            <button
              type="submit"
              className="btn btn-primary w-100"
              aria-label={t('calendar.add')}
              title={t('calendar.add')}
            >
              <i className="bi bi-plus-lg"></i>
              <span> {t('add')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddCalendarPage;
