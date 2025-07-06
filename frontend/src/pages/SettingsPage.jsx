import React, { useState, useEffect, useContext } from 'react';
import Security from './settings/Security';
import Notification from './settings/Notification';
import Account from './settings/Account';
import Preferences from './settings/Preferences';
import { Link, useLocation } from 'react-router-dom';
import { handleLogout, resetPassword } from '../services/authService';
import { UserContext } from '../contexts/UserContext';
import AlertSystem from '../components/AlertSystem';
import { useTranslation } from 'react-i18next';

const SettingsPage = ({ sharedProps }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { userInfo } = useContext(UserContext);
  const [alertType, setAlertType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'account';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    // Met à jour le tab si l’URL change
    setActiveTab(getInitialTab());
  }, [location.search]);

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <Account {...sharedProps} />;
      case 'security':
        return <Security {...sharedProps} />;
      case 'notifications':
        return <Notification {...sharedProps} />;
      case 'preferences':
        return <Preferences {...sharedProps} />;
      default:
        return <Account {...sharedProps} />;
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* 🧭 Onglets verticaux Bootstrap */}
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm rounded">
            <div className="card-body p-3">
              <h5 className="mb-3">{t('settings')}</h5>
              <div className="nav flex-column nav-pills">
                <Link
                  className={`nav-link text-start ${activeTab === 'account' ? 'active' : ''}`}
                  to="/settings?tab=account"
                >
                  <i className="bi bi-person me-2"></i> {t('settings.account')}
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'security' ? 'active' : ''}`}
                  to="/settings?tab=security"
                >
                  <i className="bi bi-shield-lock me-2"></i> {t('settings.security')}
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'notifications' ? 'active' : ''}`}
                  to="/settings?tab=notifications"
                >
                  <i className="bi bi-bell me-2"></i> {t('notifications')}
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'preferences' ? 'active' : ''}`}
                  to="/settings?tab=preferences"
                >
                  <i className="bi bi-sliders me-2"></i> {t('settings.preferences')}
                </Link>
                <hr />
                <button
                  aria-label={t('logout')}
                  title={t('logout')}
                  onClick={handleLogout}
                  className='btn btn-outline-primary text-start nav-link text-start'
                >
                  <i className="bi bi-unlock fs-5 me-2"></i> {t('logout')}
                </button>
                {showAlert && <AlertSystem type={alertType} message={alertMessage} />}
                <button
                  aria-label={t('reset_password.title')}
                  title={t('reset_password.title')}
                  onClick={() => {
                    resetPassword(userInfo.email);
                    setAlertType('success');
                    setAlertMessage(t('reset_password.success'));
                    setShowAlert(true);
                  }}
                  className='btn btn-outline-primary text-start nav-link text-start'
                >
                  <i className="bi bi-envelope fs-5 me-2"></i> {t('reset_password.title')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 📄 Contenu de l'onglet actif */}
        <div className="col-md-9">
          <div className="card shadow-sm rounded p-4 bg-white">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
