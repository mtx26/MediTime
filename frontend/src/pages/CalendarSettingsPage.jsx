import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Stock from './calendar-settings/Stock';
// import Sharing from './calendar-settings/Sharing';

function CalendarSettingsPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const sharedProps = {
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  };

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'stock';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  const renderTab = () => {
    switch (activeTab) {
      case 'stock':
        return <Stock {...sharedProps} />;
      // case 'sharing':
      //   return <Sharing {...sharedProps} />;
      default:
        return <Stock {...sharedProps} />;
    }
  };

  // 🔁 basePath dynamique basé sur l'URL actuelle
  const basePath = location.pathname.split('?')[0]; // garde tout avant ? (donc /calendar/.../settings ou /shared-user-calendar/.../settings)

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm rounded">
            <div className="card-body p-3">
              <h5 className="mb-3">{t('calendar_settings.label')}</h5>
              <div className="nav flex-column nav-pills">
                <Link
                  className={`nav-link text-start ${activeTab === 'stock' ? 'active' : ''}`}
                  to={`${basePath}?tab=stock`}
                >
                  <i className="bi bi-capsule me-2"></i>
                  {t('calendar_settings.stock.label')}
                </Link>
                <Link
                  className={`nav-link text-start ${activeTab === 'sharing' ? 'active' : ''}`}
                  to={`${basePath}?tab=sharing`}
                >
                  <i className="bi bi-share me-2"></i>
                  {t('calendar_settings.sharing.label')}
                </Link>
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
};

export default CalendarSettingsPage;
