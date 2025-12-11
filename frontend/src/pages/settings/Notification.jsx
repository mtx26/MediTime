import React, { use, useContext, useState } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '../../services/auth/authService';
import { getToken } from '../../services/supabase/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

export default function Notification({ fcm }) {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;
  const [notificationsEnabled, setNotificationsEnabled] = useState(window?.Notification?.permission === 'granted');
  const notificationNotSupported = !('Notification' in window) || window.Notification.permission === 'denied';
  const [isRegistering, setIsRegistering] = useState(false);

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
        <div className="card-body d-flex flex-column flex-md-row align-items-center justify-content-between py-2 px-3 gap-3">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <i className="bi bi-bell-fill text-primary me-2" style={{fontSize: '1.3rem'}}></i>
            <div>
              <div className="fw-semibold text-dark" style={{fontSize: '1rem'}}>{t('fcm.device_registration')}</div>
              <div className="text-secondary small">{t('fcm.device_registration_desc')}</div>
            </div>
          </div>
          {notificationNotSupported ? null : (
            <button 
              className={`btn btn-sm d-flex align-items-center ${notificationsEnabled ? 'btn-success' : 'btn-primary fw-bold'}`}
              onClick={async () => {
                setIsRegistering(true);
                await fcm.sendTokenToBackend()
                setIsRegistering(false);
                setNotificationsEnabled(window.Notification.permission === 'granted');
              }}
              disabled={isRegistering}
              style={{fontSize: '0.95rem', borderRadius: '1.2rem', minWidth: '120px'}}
            >
              {notificationsEnabled ? (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  {t('fcm.reload')}
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
          )}
        </div>
      </div>
    </div>
  );
};
