// src/pages/AcceptInvitePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import { set } from 'lodash';

function AcceptInvitePage({sharedUserCalendars}) {
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
    setType(params.get('type') || '');
  }, []);

  useEffect(() => {
    if (!token || !type) {
      return;
    }
    getInvitation();
  }, [token, type, setLoading]);

  const getInvitation = async () => {
    if (type === 'login') {
      const rep = await sharedUserCalendars.getLoginInvitation(token);
      if (rep.success) {
        setInvitation(rep.invitation);
        console.log(rep.invitation);
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.getRegistrationInvitation(token);
      if (rep.success) {
        setInvitation(rep.invitation);
        console.log(rep.invitation);
      }
    }
    setLoading(false);
  }

  const handleAccept = async () => {
    setLoading(true);
    let calendarId = null;

    if (type === 'login') {
      const rep = await sharedUserCalendars.acceptLoginInvitation(token);
      if (rep.success) {
        calendarId = rep.calendar_id;
        navigate(`/shared-user-calendar/${calendarId}`);
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.acceptRegistrationInvitation(token);
      if (rep.success) {
        calendarId = rep.calendar_id;
        navigate(`/shared-user-calendar/${calendarId}`);
      }
    }
    setLoading(false);
  }

  const handleReject = async () => {
    setLoading(true);
    if (type === 'login') {
      const rep = await sharedUserCalendars.rejectLoginInvitation(token);
      if (rep.success) {
        navigate('/calendars');
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.rejectRegistrationInvitation(token);
      if (rep.success) {
        navigate('/calendars');
      }
    }
    setLoading(false);
  }

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

  if (loading === false && !invitation) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invitation.invalid_or_expired')}
      </div>
    );
  }

  return (
    <div className="container card shadow p-0" style={{ maxWidth: '600px' }}>
      {/* Titre
        TODO: ajouter alert pour error
      */}
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
            <span className="fs-5 fw-semibold">{invitation.calendar_name}</span>
          </div>
        </div>

        {/* Colonne Propriétaire */}
        <div className="col-md-6 text-center">
          <div className="fw-semibold text-muted mb-1">{t('owner')}</div>
          <HoveredUserProfile
            user={{
              photo_url: invitation.owner_photo_url,
              display_name: invitation.owner_display_name,
              email: invitation.owner_email,
            }}
            trigger={
              <div
                className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded bg-light border"
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={invitation.owner_photo_url}
                  alt={t('profile')}
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
                <strong>{invitation.owner_display_name}</strong>
              </div>
            }
          />
        </div>
      </div>

      {/* Bloc boutons en bas */}
      <div className="p-3 d-flex gap-2">
        <button className="btn btn-success col-6" onClick={handleAccept}>
          <i className="bi bi-check-lg me-2"></i>{t('accept')}
        </button>
        <button className="btn btn-danger col-6" onClick={handleReject}>
          <i className="bi bi-x-lg me-2"></i>{t('reject')}
        </button>
      </div>
    </div>
  );
}

export default AcceptInvitePage;
