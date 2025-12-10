import React, { use, useContext, useState } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '../../services/auth/authService';
import { requestPermissionAndGetToken } from '../../services/firebase/firebase';
import { getToken } from '../../services/supabase/tokenUtils';
import { log } from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL;

const Notification = () => {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;
  const [notificationsEnabled, setNotificationsEnabled] = useState(window.Notification.permission === 'granted');
  const [isRegistering, setIsRegistering] = useState(false);

  // 🔐 Demande de permission et envoi du token
  const sendTokenToBackend = async () => {
    setIsRegistering(true);
    const tokenFcm = await requestPermissionAndGetToken(userInfo?.uid);
    const token = await getToken();
    if (!token || !userInfo?.uid) return;

    // 🎯 Envoi du token FCM au backend Flask
    fetch(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        token: tokenFcm,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        log.info(t('fcm.token_registered'), {
          uid: userInfo.uid,
          token: tokenFcm,
          origin: 'FCM_TOKEN',
          code: 'FCM_TOKEN_REGISTER_SUCCESS',
        });
      })
      .catch((error) => {
        log.error(t('fcm.token_send_error'), {
          uid: userInfo.uid,
          token: tokenFcm,
          origin: 'FCM_TOKEN',
          code: 'FCM_TOKEN_REGISTER_ERROR',
          error: error,
        });
      });
    setNotificationsEnabled(window.Notification.permission === 'granted');
    setIsRegistering(false);
  };

  return (
    <div>
      <h2 className="mb-4">{t('notifications')}</h2>
      <p className="text-muted mb-4">{t('notification.instructions')}</p>

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input fs-5"
          type="checkbox"
          id="emailNotificationToggle"
          checked={userInfo?.emailEnabled}
          onChange={() => {
            updateUserInfo({
              email_enabled: !userInfo?.emailEnabled,
              uid
            })
          }}
        />
        <label className="form-check-label" htmlFor="emailNotificationToggle">
          {t('notification.email_toggle')}
        </label>
      </div>

      <div className="form-check form-switch mb-4">
        <input
          className="form-check-input fs-5"
          type="checkbox"
          id="pushNotificationToggle"
          checked={userInfo?.pushEnabled}
          onChange={() => {
            updateUserInfo({
              push_enabled: !userInfo?.pushEnabled
            })
          }}
        />
        <label className="form-check-label" htmlFor="pushNotificationToggle">
          {t('notification.push_toggle')}
        </label>
      </div>
      <div className="card bg-light border-0 mb-3 p-0">
        <div className="card-body d-flex align-items-center justify-content-between py-2 px-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-bell-fill text-primary me-2" style={{fontSize: '1.3rem'}}></i>
            <div>
              <div className="fw-semibold text-dark" style={{fontSize: '1rem'}}>{t('fcm.device_registration')}</div>
              <div className="text-secondary small">{t('fcm.device_registration_desc')}</div>
            </div>
          </div>
          <button 
            className={`btn btn-sm d-flex align-items-center ${notificationsEnabled ? 'btn-success' : 'btn-primary fw-bold'}`}
            onClick={sendTokenToBackend}
            disabled={notificationsEnabled || isRegistering}
            style={{fontSize: '0.95rem', borderRadius: '1.2rem', minWidth: '120px'}}
          >
            {notificationsEnabled ? (
              <>
                <i className="bi bi-check-circle me-2"></i>
                {t('fcm.enabled_msg')}
              </>
            ) : isRegistering ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <i className="bi bi-bell me-2"></i>
                {t('fcm.enable_btn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
