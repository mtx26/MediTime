import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Stock from './calendar-settings/Stock';
import Notifications from './calendar-settings/Notifications.jsx';
// import Sharing from './calendar-settings/Sharing';

function CalendarSettingsPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();

  const sharedProps = {
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  };

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab) return tab;

    // Valeur par défaut selon le type de calendrier
    switch (calendarType) {
      case 'personal':
        return 'stock';
      case 'sharedUser':
        return 'notifications';
      default:
        return null;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  const renderTab = () => {
    switch (activeTab) {
      case 'stock':
        if (calendarType === 'personal') {
          return <Stock {...sharedProps} />;
        }
        break;
      case 'notifications':
        if (calendarType === 'sharedUser') {
          return <Notification {...sharedProps} />;
        }
        break;
      // case 'sharing':
      //   return <Sharing {...sharedProps} />;
      default:
        if (calendarType === 'personal') {
          return <Stock {...sharedProps} />;
        }
        if (calendarType === 'sharedUser') {
          return <Notification {...sharedProps} />;
        }
        return null;
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm rounded">
            <div className="card-body p-3">
              <h5 className="mb-3">{t('calendar_settings.label')}</h5>
              <div className="nav flex-column nav-pills">

                {calendarType === 'personal' && (
                  <>
                    <Link
                      className={`nav-link text-start ${activeTab === 'stock' ? 'active' : ''}`}
                      to={`/${basePath}/${calendarId}/settings?tab=stock`}
                    >
                      <i className="bi bi-capsule me-2"></i>
                      {t('calendar_settings.stock.label')}
                    </Link>
                  </>
                )}

                {calendarType === 'sharedUser' && (
                  <>
                    <Link
                      className={`nav-link text-start ${activeTab === 'notifications' ? 'active' : ''}`}
                      to={`/${basePath}/${calendarId}/settings?tab=notifications`}
                    >
                      <i className="bi bi-bell me-2"></i>
                      {t('calendar_settings.notifications.label')}
                    </Link>
                  </>
                )}

                {/* 
                <Link
                  className={`nav-link text-start ${activeTab === 'sharing' ? 'active' : ''}`}
                  to={`/${basePath}/${calendarId}/settings?tab=sharing`}
                >
                  <i className="bi bi-share me-2"></i>
                  {t('calendar_settings.sharing.label')}
                </Link>
                */}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm rounded p-4 bg-white">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarSettingsPage;
