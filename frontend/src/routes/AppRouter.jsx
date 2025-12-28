import React, { useContext, lazy, Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../contexts/UserContext';

const HomePage = lazy(() => import('../pages/general/HomePage'));

const Auth = lazy(() => import('../pages/auth/Auth'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const ResetPasswordConfirm = lazy(() => import('../pages/auth/ResetPasswordConfirm'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));

const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const AddCalendarPage = lazy(() => import('../pages/calendars/AddCalendarPage'));
const MedicineReview = lazy(() => import('../pages/calendars/MedicineReview'));
const AcceptInvitePage = lazy(() => import('../pages/calendars/calendar/share/AcceptInvitePage'));

const CalendarView = lazy(() => import('../pages/calendars/calendar/CalendarView'));
const PillboxPage = lazy(() => import('../pages/calendars/calendar/pillbox/Pillbox'));
const DailyCalendarPage = lazy(() => import('../pages/calendars/calendar/DailyCalendarPage'));
const CalendarList = lazy(() => import('../pages/calendars/CalendarList'));
const SharedList = lazy(() => import('../pages/calendars/calendar/share/SharedList'));
const StockAlertsPage = lazy(() => import('../pages/calendars/calendar/StockAlertsPage'));
const PillboxUses = lazy(() => import('../pages/calendars/calendar/pillbox/PillboxUses'));

const MedicinesList = lazy(() => import('../pages/calendars/calendar/medicines/MedicinesList'));
const BoxesView = lazy(() => import('../pages/calendars/calendar/medicines/BoxesView'));
const IcsList = lazy(() => import('../pages/calendars/calendar/medicines/IcsList'));
const NotFound = lazy(() => import('../pages/general/NotFound'));

const PrivacyPage = lazy(() => import('../pages/general/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/general/TermsPage'));

const AuthCallback = lazy(() => import('../pages/auth/AuthCallback'));
const CalendarSettingsPage = lazy(() => import('../pages/calendars/calendar/settings/CalendarSettingsPage'));

function buildFullPath(loc) {
  const path = loc.pathname || '/';
  const qs = loc.search || '';
  const hash = loc.hash || '';
  return `${path}${qs}${hash}`;
}

function PrivateRoute({ element }) {
  const { userInfo } = useContext(UserContext);
  const location = useLocation();
  const { lng } = useParams();

  if (!userInfo) {
    const full = buildFullPath(location);
    return (
      <Navigate
        to={`/${lng}/login?redirect=${encodeURIComponent(full)}`}
        replace
      />
    );
  }
  return element;
}

function SuspenseFallback() {
  const { showLoading } = useLoading();
  const { t } = useTranslation();

  useEffect(() => {
    showLoading(true, t('loading'));
    return () => showLoading(false, '');
  }, [showLoading, t]);

  return null;
}

function RouteWithLoader({ element, isLoading }) {
  const { showLoading } = useLoading();
  const { t } = useTranslation();
  
  useEffect(() => {
    showLoading(isLoading, t('loading'));
  }, [isLoading, showLoading, t]);

  if (isLoading) {
    return null;
  }
  return element;
}

function AppRoutes({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const { lng } = useParams();

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
      <Route
        path="login"
        element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Auth />}
      />
      <Route
        path="register"
        element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Auth />}
      />
      <Route
        path="reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="reset-password-confirm"
        element={<ResetPasswordConfirm />}
      />
      <Route
        path="verify-email"
        element={userInfo ? <VerifyEmail /> : <Navigate to={`/${lng}/login`} />}
      />

      <Route
        path="settings"
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
        path="notifications"
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
        path="shared-calendars"
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
      <Route path="accept-invite">
        <Route
          index
          element={
            <PrivateRoute
              element={<AcceptInvitePage {...sharedProps} />}
            />
          }
        />
      </Route>
      <Route path="add-calendar">
        <Route
          index
          element={
            <PrivateRoute
              element={<AddCalendarPage {...sharedProps} />}
            />
          }
        />
        <Route
          path="review"
          element={
            <PrivateRoute
              element={<MedicineReview {...sharedProps} />}
            />
          }
        />
      </Route>
      <Route path="calendar/:calendarId">
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
          path="daily"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<DailyCalendarPage {...sharedProps} />}
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
        <Route
          path="pillbox-uses"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<PillboxUses {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="ics-tokens"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<IcsList {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
      </Route>
      <Route
        path="calendars"
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
      <Route path="shared-user-calendar/:calendarId">
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
          path="daily"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<DailyCalendarPage {...sharedProps} />}
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
        <Route
          path="pillbox-uses"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<PillboxUses {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
        <Route
          path="ics-tokens"
          element={
            <PrivateRoute
              element={
                <RouteWithLoader
                  element={<IcsList {...sharedProps} />}
                  isLoading={sharedProps.loadingStates.isInitialLoading}
                />
              }
            />
          }
        />
      </Route>
      <Route path="shared-token-calendar/:sharedToken">
        <Route index element={<CalendarView {...sharedProps} />} />
        <Route path="boxes" element={<MedicinesList {...sharedProps} />} />
        <Route path="pillbox" element={<PillboxPage {...sharedProps} />} />
      </Route>

      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="terms" element={<TermsPage />} />
      <Route path="home" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
      <Route path="" element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Navigate to={`/${lng}/home`} />} />

      <Route path="auth/callback" element={<AuthCallback />} />
      </Routes>
    </Suspense>
  );
}

AppRoutes.propTypes = {
  sharedProps: PropTypes.shape({
    loadingStates: PropTypes.shape({
      isInitialLoading: PropTypes.bool,
    }),
  }),
};

export default AppRoutes;
