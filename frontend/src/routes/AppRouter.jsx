import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { UserContext } from '../contexts/UserContext';

import Auth from '../pages/Auth';
import ResetPassword from '../pages/ResetPassword';
import ResetPasswordConfirm from '../pages/ResetPasswordConfirm';
import VerifyEmail from '../pages/VerifyEmail';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import ImportCalendarPage from '../pages/ImportCalendarPage';
import CalendarView from '../pages/CalendarView';
import PillboxPage from '../pages/pillbox';
import CalendarList from '../pages/CalendarList';
import SharedList from '../pages/SharedList';
import StockAlertsPage from '../pages/StockAlertsPage';
import MedicinesList from '../pages/MedicinesList';
import BoxesView from '../pages/BoxesView';
import NotFound from '../pages/NotFound';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';
import AuthCallback from '../pages/AuthCallback';
import HomePage from '../pages/HomePage';
import CalendarSettingsPage from '../pages/CalendarSettingsPage';

function PrivateRoute({ element }) {
  const { userInfo } = useContext(UserContext);
  if (!userInfo) return <Navigate to="/" />;
  if (!userInfo.emailVerified) return <Navigate to="/verify-email" />;
  return element;
}

function RouteWithLoader({ element, isLoading }) {
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ flexGrow: 1, minHeight: '60vh' }}>
        <span className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </span>
      </div>
    );
  }
  return element;
}

function PrivateLoaded({ element, sharedProps }) {
  return (
    <PrivateRoute
      element={
        <RouteWithLoader
          element={React.cloneElement(element, { ...sharedProps })}
          isLoading={sharedProps.loadingStates.isInitialLoading}
        />
      }
    />
  );
}

function PrivateDirect({ element, sharedProps }) {
  return (
    <PrivateRoute element={React.cloneElement(element, { ...sharedProps })} />
  );
}

function AppRoutes({ sharedProps }) {
  const { userInfo } = useContext(UserContext);

  const privateLoadedRoutes = [
    { path: '/settings', element: <SettingsPage /> },
    { path: '/notifications', element: <NotificationsPage /> },
    { path: '/shared-calendars', element: <SharedList /> },
    { path: '/calendars', element: <CalendarList /> },
  ];

  const calendarRoutes = [
    { subPath: '', element: <CalendarView /> },
    { subPath: 'boxes', element: <BoxesView /> },
    { subPath: 'pillbox', element: <PillboxPage /> },
    { subPath: 'settings', element: <CalendarSettingsPage /> },
    { subPath: 'stock-alerts', element: <StockAlertsPage /> },
  ];

  return (
    <Routes>
      <Route path="/login" element={userInfo ? <Navigate to="/calendars" /> : <Auth />} />
      <Route path="/register" element={userInfo ? <Navigate to="/calendars" /> : <Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
      <Route path="/verify-email" element={userInfo ? <VerifyEmail /> : <Navigate to="/login" />} />

      {privateLoadedRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PrivateLoaded element={element} sharedProps={sharedProps} />}
        />
      ))}

      <Route
        path="/import-calendar"
        element={<PrivateDirect element={<ImportCalendarPage />} sharedProps={sharedProps} />}
      />

      <Route path="/calendar/:calendarId">
        {calendarRoutes.map(({ subPath, element }) => (
          <Route
            key={`calendar-${subPath || 'index'}`}
            path={subPath}
            index={!subPath}
            element={<PrivateLoaded element={element} sharedProps={sharedProps} />}
          />
        ))}
      </Route>

      <Route path="/shared-user-calendar/:calendarId">
        {calendarRoutes.map(({ subPath, element }) => (
          <Route
            key={`shared-user-${subPath || 'index'}`}
            path={subPath}
            index={!subPath}
            element={<PrivateLoaded element={element} sharedProps={sharedProps} />}
          />
        ))}
      </Route>

      <Route path="/shared-token-calendar/:sharedToken">
        <Route index element={<CalendarView {...sharedProps} />} />
        <Route path="boxes" element={<MedicinesList {...sharedProps} />} />
        <Route path="pillbox" element={<PillboxPage {...sharedProps} />} />
      </Route>

      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}

export default AppRoutes;
