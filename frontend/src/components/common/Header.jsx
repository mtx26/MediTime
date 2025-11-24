import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { handleLogout } from '../../services/auth/authService';
import HoveredUserProfile from './HoveredUserProfile';
import NotificationLine from './NotificationLine';
import PropTypes from 'prop-types';
import LanguageSelector from './LanguageSelector.jsx';
import { useTranslation } from 'react-i18next';

function buildLocationList(pathWithSlash) {
  return {
    calendar: pathWithSlash.startsWith('/calendar/'),
    sharedUserCalendar: pathWithSlash.startsWith('/shared-user-calendar/'),
    tokenCalendar: pathWithSlash.startsWith('/shared-token-calendar/'),
  };
}

function buildReturnToCalendarList(pathParts) {
  return {
    calendar: pathParts.length === 2 && pathParts[0] === 'calendar',
    sharedUserCalendar:
      pathParts.length === 2 && pathParts[0] === 'shared-user-calendar',
  };
}

function buildReturnToCalendar(pathParts) {
  const isDetailPage =
    pathParts.length === 3 &&
    ['medicines', 'boxes', 'pillbox', 'settings', 'stock-alerts', 'daily'].includes(
      pathParts[2]
    );
  return {
    calendar: pathParts[0] === 'calendar' && isDetailPage,
    sharedUserCalendar:
      pathParts[0] === 'shared-user-calendar' && isDetailPage,
    tokenCalendar: pathParts.length === 3 && pathParts[0] === 'shared-token-calendar',
  };
}

const isPillbox = (pathParts) =>
  pathParts.length === 3 &&
  ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(
    pathParts[0]
  ) &&
  pathParts[2] === 'pillbox';

function Navbar({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { lng } = useParams();
    const { t } = useTranslation();
    const [calendarInfo, setCalendarInfo] = useState(null);
    const [basePath, setBasePath] = useState(null);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const notifRef = useRef();
    const userRef = useRef();
    const [tokenId, setTokenId] = useState(null);
    const pathAfterLang = location.pathname.split('/').slice(2).join('/');
    const pathWithSlash = '/' + pathAfterLang;
    const pathParts = pathAfterLang.split('/').filter(Boolean);
    const locationList = buildLocationList(pathWithSlash);
    const locationAvailableForReturnToCalendarList = buildReturnToCalendarList(pathParts);
    const locationAvailableForReturnToCalendar = buildReturnToCalendar(pathParts);
    const isPillboxPage = isPillbox(pathParts);

  useEffect(() => {
    if (locationList.calendar && sharedProps.personalCalendars.calendarsData) {
      setBasePath('calendar');
      setCalendarInfo(
        sharedProps.personalCalendars.calendarsData.find(
          (calendar) => calendar.id === pathParts[1]
        )
      );
    } else if (
      locationList.sharedUserCalendar &&
      sharedProps.sharedUserCalendars.sharedCalendarsData
    ) {
      setBasePath('shared-user-calendar');
      setCalendarInfo(
        sharedProps.sharedUserCalendars.sharedCalendarsData.find(
          (calendar) => calendar.id === pathParts[1]
        )
      );
    } else if (locationList.tokenCalendar) {
      setBasePath('shared-token-calendar');
      setTokenId(pathParts[1]);
    } else {
      setCalendarInfo(null);
      setBasePath(null);
      setTokenId(null);
    }
  }, [
    location.pathname,
    sharedProps.personalCalendars.calendarsData,
    sharedProps.sharedUserCalendars.sharedCalendarsData,
  ]);

    const handleClickOutside = useCallback((e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    }, []);

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

  const { notificationsData, readNotification } = sharedProps.notifications;

  if (isPillboxPage) {
    return (
      <Link
        to={`/${lng}/${basePath}/${calendarInfo?.id}`}
        className="fs-2 text-dark align-self-end"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1050,
        }}
        aria-label="Fermer"
      >
        <i className="bi bi-x-lg" aria-hidden="true"></i>
        <span className="visually-hidden">Fermer</span>
      </Link>
    );
  }
  
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm py-2 sticky-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {/* Logo / Retour */}
          {locationAvailableForReturnToCalendarList.calendar ||
          locationAvailableForReturnToCalendarList.sharedUserCalendar ? (
            <Link to={`/${lng}/calendars`} className="navbar-brand fs-4">
              <i className="bi bi-arrow-left"></i> {t('back')}
            </Link>
          ) : calendarInfo?.id &&
            basePath &&
            (locationAvailableForReturnToCalendar.calendar ||
              locationAvailableForReturnToCalendar.sharedUserCalendar) ? (
            <Link
              to={`/${lng}/${basePath}/${calendarInfo.id}`}
              className="navbar-brand fs-4"
            >
              <i className="bi bi-arrow-left"></i> {t('back')}
            </Link>
          ) : locationList.tokenCalendar &&
            tokenId &&
            locationAvailableForReturnToCalendar.tokenCalendar ? (
            <Link
              to={`/${lng}/shared-token-calendar/${tokenId}`}
              className="navbar-brand fs-4"
            >
              <i className="bi bi-arrow-left"></i> {t('back')}
            </Link>
          ) : (
            <Link to={`/${lng}/`} className="navbar-brand fw-bold text-primary fs-4">
              <i className="bi bi-capsule"></i> {t('app.title')}
            </Link>
          )}

          {/* Titre calendrier + badge */}
          {((calendarInfo && calendarInfo.id) ||
            (locationList.tokenCalendar && tokenId)) && (
            <>
              {/* Titre calendrier pour desktop + badge desktop */}
              <div className="d-none d-lg-flex justify-content-center text-decoration-none text-dark">
                <div className="d-flex flex-column align-items-start w-auto">
                  <h4 className="m-0">
                    {calendarInfo && basePath && calendarInfo.id && (
                      <Link
                        to={`/${lng}/${basePath}/${calendarInfo.id}`}
                        className="text-decoration-none text-dark"
                      >
                        <span className="text-muted">{t('calendar.label')} : </span>
                        <span className="fw-bold">{calendarInfo.name}</span>
                      </Link>
                    )}
                  </h4>
                  {locationList.sharedUserCalendar && (
                    <div className="badge bg-info mt-2">
                      {t('shared_by')}{' '}
                      <HoveredUserProfile
                        user={{
                          email: calendarInfo.owner_email,
                          display_name: calendarInfo.owner_name,
                          photo_url: calendarInfo.owner_photo_url,
                        }}
                        trigger={<span>{calendarInfo.owner_name}</span>}
                      />
                    </div>
                  )}
                  {locationList.tokenCalendar && tokenId && (
                    <Link
                      to={`/${lng}/shared-token-calendar/${tokenId}`}
                      className="text-decoration-none text-dark"
                    >
                      <div className="badge bg-info mt-2">
                        {t('shared_by_token')}
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Titre calendrier pour mobile + badge mobile */}
              <div className="d-flex d-lg-none flex-column align-items-end w-auto text-decoration-none text-dark">
                {calendarInfo && basePath && calendarInfo.id && (
                  <h4 className="m-1 fw-bold">
                    <Link
                      to={`/${lng}/${basePath}/${calendarInfo.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {calendarInfo.name}
                    </Link>
                  </h4>
                )}
                {locationList.sharedUserCalendar && (
                  <div className="badge bg-info d-flex flex-column align-items-end">
                    <HoveredUserProfile
                      user={{
                        email: calendarInfo.owner_email,
                        display_name: calendarInfo.owner_name,
                        photo_url: calendarInfo.owner_photo_url,
                      }}
                      trigger={<span>{calendarInfo.owner_name}</span>}
                    />
                  </div>
                )}
                {locationList.tokenCalendar && tokenId && (
                  <Link
                    to={`/${lng}/shared-token-calendar/${tokenId}`}
                    className="text-decoration-none text-dark"
                  >
                    <div className="badge bg-info">
                      {t('shared_by_token')}
                    </div>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Liens navigation + notifs + profil */}
          <div className="d-none d-lg-flex align-items-center">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item">
                <Link to={`/${lng}/calendars`} className="nav-link">
                  <i className="bi bi-calendar-date fs-5"></i> {t('calendars')}
                </Link>
              </li>
              <li className="nav-item">
                <Link to={`/${lng}/shared-calendars`} className="nav-link">
                  <i className="bi bi-box-arrow-up fs-5"></i> {t('shared')}
                </Link>
              </li>
              {userInfo?.role === 'admin' && (
                <li className="nav-item">
                  <Link to={`/${lng}/admin`} className="nav-link">
                    <i className="bi bi-lock fs-5"></i> {t('admin')}
                  </Link>
                </li>
              )}
              <LanguageSelector />

              {/* Notifs */}
              <li
                className="nav-item dropdown position-relative"
                ref={notifRef}
              >
                <button
                  aria-label="Notifications"
                  title="Notifications"
                  className="nav-link bg-transparent border-0 position-relative"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notificationsData &&
                    notificationsData.filter((notif) => !notif.read).length >
                      0 && (
                      <span className="position-absolute top-10 start-90 translate-middle badge rounded-pill bg-danger fs-7">
                        {
                          notificationsData.filter((notif) => !notif.read)
                            .length
                        }
                      </span>
                    )}
                </button>
                {showNotifDropdown && (
                  <ul
                    className="dropdown-menu dropdown-menu-end p-2 show"
                    style={{
                      minWidth: '500px',
                      right: '0',
                      left: 'auto',
                    }}
                  >
                    {notificationsData === null ? (
                      <li className="dropdown-item text-muted fs-6">
                        {t('loading_notifications')}
                      </li>
                    ) : (
                      notificationsData
                        .filter((notif) => !notif.read)
                        .slice(0, 5)
                        .map((notif) => (
                          <NotificationLine
                            key={notif.notification_id}
                            notif={notif}
                            onRead={readNotification}
                            navigate={navigate}
                          />
                        ))
                    )}
                    {notificationsData &&
                      notificationsData.filter((notif) => !notif.read)
                        .length === 0 && (
                        <li className="dropdown-item text-muted fs-6">
                          {t('no_notifications')}
                        </li>
                      )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li className="text-center">
                      <Link
                        className="btn btn-sm btn-outline-primary w-100"
                        aria-label="Ouvrir les notifications"
                        title="Ouvrir les notifications"
                        to={`/${lng}/notifications`}
                        onClick={() => setShowNotifDropdown(false)}
                      >
                        <i className="bi bi-bell"></i> {t('open_notifications')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              {/* Profil */}
              <li className="nav-item dropdown position-relative" ref={userRef}>
                <button
                  className="nav-link d-flex align-items-center border-0 bg-transparent"
                  aria-label="Profil"
                  title="Profil"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {userInfo ? (
                    <>
                      <img
                        src={
                          userInfo.photoUrl ||
                          'https://www.w3schools.com/howto/img_avatar.png'
                        }
                        alt="Profil"
                        className="rounded-circle me-2"
                        width="32"
                        height="32"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <span className="text-muted">
                        {userInfo.displayName || t('user')}
                      </span>
                      <i className="bi bi-caret-down-fill ms-2"></i>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-circle fs-3 me-2"></i>
                      <span className="text-muted">{t('account.label')}</span>
                    </>
                  )}
                </button>
                {showUserDropdown && (
                  <ul
                    className="dropdown-menu dropdown-menu-end p-2 show"
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      right: '0',
                      left: 'auto',
                    }}
                  >
                    {userInfo ? (
                      <>
                        <li>
                          <Link className="dropdown-item" to={`/${lng}/profile`}>
                            <i className="bi bi-person fs-5 me-2"></i> {t('profile')}
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to={`/${lng}/settings`}>
                            <i className="bi bi-gear fs-5 me-2"></i> {t('settings.label')}
                          </Link>
                        </li>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            aria-label="Déconnexion"
                            title="Déconnexion"
                            onClick={handleLogout}
                          >
                            <i className="bi bi-unlock fs-5 me-2"></i>{' '}
                            {t('logout')}
                          </button>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item" to={`/${lng}/login`}>
                            <i className="bi bi-box-arrow-in-right fs-5 me-2"></i>{' '}
                            {t('login')}
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to={`/${lng}/register`}>
                            <i className="bi bi-person-plus fs-5 me-2"></i>{' '}
                            {t('register')}
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <nav className="navbar fixed-bottom bg-white shadow-sm py-2 border-top border-2 d-lg-none">
        <div className="container-fluid d-flex justify-content-around mb-3">
          <Link
            to={`/${lng}/calendars`}
            className="text-center text-dark text-decoration-none link-hover"
          >
            <i className="bi bi-calendar-event fs-1"></i>
          </Link>
          <Link
            to={`/${lng}/shared-calendars`}
            className="text-center text-dark text-decoration-none link-hover"
          >
            <i className="bi bi-people fs-1"></i>
          </Link>
          <Link
            to={`/${lng}/notifications`}
            className="text-center text-dark text-decoration-none link-hover position-relative"
          >
            <i className="bi bi-bell fs-1"></i>
            {notificationsData !== null &&
              notificationsData.filter((notif) => !notif.read).length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger fs-7">
                  {notificationsData.filter((notif) => !notif.read).length}
                </span>
              )}
          </Link>
          <Link
            to={`/${lng}/settings`}
            className="text-center text-dark text-decoration-none link-hover"
          >
            {userInfo ? (
              <img
                src={
                  userInfo?.photoUrl ||
                  'https://www.w3schools.com/howto/img_avatar.png'
                }
                alt="Profil"
                className="rounded-circle"
                width="38"
                height="38"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <i className="bi bi-person-circle fs-1"></i>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}

export default Navbar;

Navbar.propTypes = {
  sharedProps: PropTypes.object.isRequired,
};
