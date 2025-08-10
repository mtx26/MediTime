// src/pages/AcceptInvitePage.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';

function AcceptInvitePage() {
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
    setType(params.get('type') || '');
    setLoading(false);
  }, []);

  // test 
  const calendarData = {
    id: 1,
    calendar_name: 'Marie',
    owner_email: 'andromede@gmail.com',
    owner_name: 'Andromède',
    owner_photo_url: 'https://res.cloudinary.com/dnxiqgm81/image/upload/v1753540143/oqejzo8h3e2levammvln.jpg',
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ flexGrow: 1, minHeight: '60vh' }}
      >
        <span className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </span>
      </div>
    );
  }

  return (
    <div className="container card shadow p-0" style={{ maxWidth: '600px' }}>
      {/* Titre */}
      <h4 className="fw-bold text-center mt-4 mb-4">
        <i className="bi bi-envelope-open me-2"></i>
        {t('invitation.title')}
      </h4>

      <div className="row align-items-start g-4 justify-content-center card-body">
        {/* Colonne Calendrier */}
        <div className="col-md-6 text-center">
          <div className="fw-semibold text-muted mb-1">{t('calendar.label')}</div>
          <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded bg-light border">
            <i className="bi bi-calendar3 text-primary"></i>
            <span className="fs-5 fw-semibold">{calendarData.calendar_name}</span>
          </div>
        </div>

        {/* Colonne Propriétaire */}
        <div className="col-md-6 text-center">
          <div className="fw-semibold text-muted mb-1">{t('owner')}</div>
          <HoveredUserProfile
            user={{
              photo_url: calendarData.owner_photo_url,
              display_name: calendarData.owner_name,
              email: calendarData.owner_email,
            }}
            trigger={
              <div
                className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded bg-light border"
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={calendarData.owner_photo_url}
                  alt={t('profile')}
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
                <strong>{calendarData.owner_name}</strong>
              </div>
            }
          />
        </div>
      </div>

      {/* Bloc boutons en bas */}
      <div className="mx-auto p-3 d-flex gap-2 w-50">
        <button className="btn btn-success col-6">
          <i className="bi bi-check-lg me-2"></i>{t('accept')}
        </button>
        <button className="btn btn-danger col-6">
          <i className="bi bi-x-lg me-2"></i>{t('reject')}
        </button>
      </div>
    </div>
  );
}

export default AcceptInvitePage;
