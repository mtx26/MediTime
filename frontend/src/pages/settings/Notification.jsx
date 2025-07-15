import React, { useContext } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { updateUserInfo } from '../../services/auth/authService';

const Notification = () => {
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;

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
    </div>
  );
};

export default Notification;
