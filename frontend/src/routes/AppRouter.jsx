import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { UserContext } from '../contexts/UserContext';

import HomePage from '../pages/HomePage';

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
import CalendarSettingsPage from '../pages/CalendarSettingsPage';

function PrivateRoute({ element }) {
  const { userInfo } = useContext(UserContext);

  if (!userInfo) {
    return <Navigate to="/" />;
  }
  if (!userInfo.emailVerified) {
    return <Navigate to="/verify-email" />;
  }
  return element;
}

function RouteWithLoader({ element, isLoading }) {
  if (isLoading) {
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
  return element;
}

function AppRoutes({ sharedProps }) {
  const { userInfo } = useContext(UserContext);

  return (
    <Routes>
      <Route
        path="/login"
        element={userInfo ? <Navigate to="/calendars" /> : <Auth />}
      />
      <Route
        path="/register"
        element={userInfo ? <Navigate to="/calendars" /> : <Auth />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="/reset-password-confirm"
        element={<ResetPasswordConfirm />}
      />
      <Route
        path="/verify-email"
        element={userInfo ? <VerifyEmail /> : <Navigate to="/login" />}
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<SettingsPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<NotificationsPage {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />

      <Route
        path="/shared-calendars"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<SharedList {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route
        path="/import-calendar"
        element={
          <PrivateRoute
            element={<ImportCalendarPage {...sharedProps} />}
          />
        }
      />
      <Route path="/calendar/:calendarId">
        <Route
          index
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<CalendarView {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="boxes"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<BoxesView {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="pillbox"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<PillboxPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="settings"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<CalendarSettingsPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="stock-alerts"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<StockAlertsPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
      </Route>
      <Route
        path="/calendars"
        element={
          <PrivateRoute
            element={
              <RouteWithLoader
                element={<CalendarList {...sharedProps} />}
                isLoading={sharedProps.loadingStates.isInitialLoading}
              />
            }
          />
        }
      />
      <Route path="/shared-user-calendar/:calendarId">
        <Route
          index
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<CalendarView {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="boxes"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<BoxesView {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="pillbox"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<PillboxPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="settings"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<CalendarSettingsPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="stock-alerts"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<StockAlertsPage {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
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
