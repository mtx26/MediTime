import { useState, useEffect, useContext } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import { UserContext } from '@/contexts/UserContext';
import { handleLogout, resetPassword } from '@/services/auth/authService';
import { SETTINGS_TABS } from '@meditime/constants';
import type { AppSharedProps } from '@meditime/types';

export function useSettings(sharedProps: AppSharedProps) {
  const location = useLocation();
  const { lng } = useParams();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;

  const getTab = () => new URLSearchParams(location.search).get('tab') || SETTINGS_TABS.ACCOUNT;
  const [activeTab, setActiveTab] = useState(getTab);

  useEffect(() => {
    setActiveTab(getTab());
  }, [location.search]);

  const handleResetPassword = () => {
    if (userInfo?.email) {
      resetPassword(userInfo.email);
      showAlert('success', t('reset_password.success'));
    }
  };

  return {
    lng,
    activeTab,
    fcm: sharedProps.fcm,
    user: sharedProps.user,
    handleLogout,
    handleResetPassword,
  };
}

