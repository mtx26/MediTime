import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import ActionSheet from '../../components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';


function SelectCalendar({
  personalCalendars,
  sharedUserCalendars
}) {
  const { lng } = useParams();
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useAlert();

  // 📅 Gestion des calendriers
  const [renameValues, setRenameValues] = useState({}); // État pour les valeurs de renommage de calendrier
  const [renameMode, setRenameMode] = useState(null); // État pour le mode de renommage

  const renameConfirmAction = async (calendarId) => {
    const rep = await personalCalendars.renameCalendar(
      calendarId,
      renameValues[calendarId]
    );
    if (rep.success) {
      setRenameValues((prev) => ({ ...prev, [calendarId]: '' }));
      showAlert('success', rep.message);
    } else {
      showAlert('danger', rep.error);
    }
  };

  // 🔄 Renommage d'un calendrier
  const handleRenameClick = (calendarId) => {
    showConfirm(
      'confirm-safe',
      t('calendar.rename_title'),
      t('calendar.rename_description'),
      () => renameConfirmAction(calendarId)
    );
  };

  const deleteConfirmAction = async (calendarId) => {
    const rep = await personalCalendars.deleteCalendar(calendarId);
    if (rep.success) {
      showAlert('success', rep.message);
    } else {
      showAlert('danger', rep.error);
    }
  };

  const handleDeleteCalendarClick = (calendarId) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      () => deleteConfirmAction(calendarId)
    );
  };

  const deleteSharedCalendarConfirmAction = async (calendarId) => {
    const rep = await sharedUserCalendars.deleteSharedCalendar(calendarId);
    if (rep.success) {
      showAlert('success', rep.message);
    } else {
      showAlert('danger', rep.error);
    }
  };

  const handleDeleteSharedCalendarClick = (calendarId) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      () => deleteSharedCalendarConfirmAction(calendarId)
    );
  };

  if (personalCalendars.calendarsData === null) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_calendars')}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="container align-items-center d-flex flex-column gap-3">

      <div className="w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-calendar-week"></i> {t('my_calendars')}
        </h4>

        {/* Liste des calendriers */}
        <div className="list-group shadow">
          {(Array.isArray(personalCalendars.calendarsData) && personalCalendars.calendarsData.length > 0) && (
            personalCalendars.calendarsData.map((calendarData, index) => (
              <div key={index} className="list-group-item">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  {/* Partie gauche : Nom + nombre */}
                  <div className="me-auto">
                    <h5 className="mb-1 fs-semibold">{calendarData.name}</h5>
                    <div className="text-muted small">
                      {t('medicines.label')}:
                      <span className="fw-semibold ms-1">
                        {calendarData.boxes_count ?? '...'}
                      </span>
                    </div>
                    {calendarData.ifLowStock && (
                      <Link className="btn p-0" to={`/${lng}/calendar/${calendarData.id}/stock-alerts`}>
                        <span className="badge bg-warning d-flex align-items-center gap-1">
                          <i className='bi bi-exclamation-triangle-fill'></i>{t('stock_alert')}
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Bouton Ouvrir */}
                  <Link
                    className="btn btn-outline-success"
                    title={t('open')}
                    aria-label={t('open')}
                    to={`/${lng}/calendar/${calendarData.id}`}
                  >
                    {t('open')}
                  </Link>

                  {/* ActionSheet */}
                  <ActionSheet
                    actions={[
                      {
                        label: (
                          <>
                            <i className="bi bi-pencil me-2"></i> {t('rename')}
                          </>
                        ),
                        onClick: () => setRenameMode(calendarData.id),
                        title: t('rename')
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-box-arrow-up me-2"></i> {t('share')}
                          </>
                        ),
                        linkTo: `/${lng}/shared-calendars?calendar=${calendarData.id}`,
                        title: t('share'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-capsule me-2"></i> {t('medicines.label')}
                          </>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/boxes`,
                        title: t('medicines.label'),
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-download me-2"></i> {t('boxes.export_pdf')}
                          </>
                        ),
                        onClick: () => personalCalendars.downloadPersonalCalendarPdf(calendarData.id),
                        title: t('boxes.export_pdf'),
                      },
                      {
                        label: (
                          <>
                            <i className="bi bi-exclamation-triangle-fill me-2"></i> {t('stock')}
                          </>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/stock-alerts`,
                        title: t('stock'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-gear me-2"></i> {t('settings.label')}
                          </>
                        ),
                        linkTo: `/${lng}/calendar/${calendarData.id}/settings`,
                        title: t('settings.label'),
                      },
                      { separator: true },
                      {
                        label: (
                          <>
                            <i className="bi bi-trash me-2"></i> {t('delete')}
                          </>
                        ),
                        onClick: () => handleDeleteCalendarClick(calendarData.id),
                        title: t('delete'),
                        danger: true,
                      },
                    ]}
                  />

                </div>
                {/* afficher la form si on est en mode renommage */}
                {renameMode === calendarData.id && (
                  <div className="d-flex justify-content-center">
                    {/* Partie pour renommer un calendrier */}
                    <form
                      className="input-group input-group w-100 w-md-auto"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameClick(calendarData.id);
                        setRenameMode(null);
                      }}
                    >
                      <input
                        id={'renameCalendarName' + calendarData.id}
                        aria-label={t('calendar.new_name')}
                        type="text"
                        className="form-control form-control"
                        placeholder={t('calendar.new_name')}
                        required
                        value={renameValues[calendarData.id] || ''} // Valeur du champ de renommage
                        onChange={(e) =>
                          setRenameValues({
                            ...renameValues,
                            [calendarData.id]: e.target.value,
                          })
                        } // Mise à jour de l'état
                      />
                      <button
                        className="btn btn-warning"
                        title={t('rename')}
                        type="submit"
                        aria-label={t('rename')}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title={t('cancel')}
                        type="button"
                        aria-label={t('cancel')}
                        onClick={() => setRenameMode(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
          <Link
            className={`text-center btn btn-outline-primary ${personalCalendars.calendarsData.length > 0 ? 'rounded-0 rounded-bottom' : ''}`}
            to={`/${lng}/add-calendar`}
            data-tour="add-calendar-btn"
          >
            <i className="bi bi-calendar-plus me-2"></i> {t('calendar.add_calendar')}
          </Link>
        </div>
      </div>

      <div className="w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-people"></i> {t('shared_calendars')}
        </h4>

        {/* Liste des calendriers partagés */}
        {Array.isArray(sharedUserCalendars.sharedCalendarsData) &&
        sharedUserCalendars.sharedCalendarsData.length > 0 ? (
          <div className="list-group shadow">
            {sharedUserCalendars.sharedCalendarsData.map(
              (calendarData, index) => (
                <div key={index} className="list-group-item">

                  <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                    <div className="flex-grow-1">
                      <h5 className="mb-1 fs-semibold">{calendarData.name}</h5>
                      <div className="text-muted small">
                        {t('medicines.label')}:
                        <span className="fw-semibold ms-1">
                          {calendarData.boxes_count ?? '...'}
                        </span>
                      </div>
                      <div className="text-muted small d-flex align-items-center ">
                        <HoveredUserProfile
                          user={{
                            email: calendarData.owner_email,
                            display_name: calendarData.owner_name,
                            photo_url: calendarData.owner_photo_url,
                          }}
                          trigger={
                            <span
                              className="fw-semibold position-relative"
                              style={{ cursor: 'pointer' }}
                            >
                              {calendarData.owner_name}
                            </span>
                          }
                        />
                      </div>
                      {calendarData.ifLowStock && (
                        <Link className="btn p-0" to={`/${lng}/shared-user-calendar/${calendarData.id}/stock-alerts`}>
                          <span className="badge bg-warning d-flex align-items-center gap-1">
                            <i className='bi bi-exclamation-triangle-fill'></i>{t('stock_alert')}
                          </span>
                        </Link>
                      )}
                    </div>

                    <Link
                      className="btn btn-outline-success"
                      title={t('open')}
                      aria-label={t('open')}
                      to={`/${lng}/shared-user-calendar/${calendarData.id}`}
                    >
                      {t('open')}
                    </Link>
                    <ActionSheet
                      actions={[
                        {
                          label: (
                            <>
                              <i className="bi bi-capsule me-2"></i> {t('medicines.label')}
                            </>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/boxes`,
                          title: t('medicines.label'),
                        },
                        {
                          label: (
                            <>
                              <i className="bi bi-download me-2"></i> {t('boxes.export_pdf')}
                            </>
                          ),
                          onClick: () => personalCalendars.downloadPersonalCalendarPdf(calendarData.id),
                          title: t('boxes.export_pdf'),
                        },
                        {
                          label: (
                            <>
                              <i className="bi bi-exclamation-triangle-fill me-2"></i> {t('stock')}
                            </>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/stock-alerts`,
                          title: t('stock'),
                        },
                        { separator: true },
                        {
                          label: (
                            <>
                              <i className="bi bi-gear me-2"></i> {t('settings.label')}
                            </>
                          ),
                          linkTo: `/${lng}/shared-user-calendar/${calendarData.id}/settings`,
                          title: t('settings.label'),
                        },
                        { separator: true },
                        {
                          label: (
                            <>
                              <i className="bi bi-trash3 me-2"></i> {t('delete')}
                            </>
                          ),
                          onClick: () => handleDeleteSharedCalendarClick(calendarData.id),
                          title: t('delete'),
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="alert alert-warning">
            {t('no_shared_calendars')}
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectCalendar;
