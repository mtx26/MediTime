import { useContext, lazy, Suspense, type ReactElement } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import PrivateRoute from './PrivateRoute';
import SuspenseFallback from './SuspenseFallback';
import RouteWithLoader from './RouteWithLoader';
import PrivateCalendarSubRoutes from './PrivateCalendarSubRoutes';
import type { AppSharedProps } from '@meditime/types';

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
const CalendarList = lazy(() => import('../pages/calendars/CalendarList'));
const SharedList = lazy(() => import('../pages/calendars/calendar/share/SharedList'));
// TODO: MedicinesList page removed — recreate or replace
const NotFound = lazy(() => import('../pages/general/NotFound'));

const PrivacyPage = lazy(() => import('../pages/general/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/general/TermsPage'));

const AuthCallback = lazy(async () => ({
  default: (await import('../pages/auth/AuthCallback')).default as unknown as React.ComponentType,
}));

export default function AppRoutes({ sharedProps }: { sharedProps: AppSharedProps }): ReactElement {
  const context = useContext(UserContext);
  const userInfo = context?.userInfo ?? null;
  const { lng } = useParams();
  const isInitialLoading = Boolean(sharedProps.loadingStates?.isInitialLoading);

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="login" element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Auth />} />
        <Route path="register" element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Auth />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="reset-password-confirm" element={<ResetPasswordConfirm />} />
        <Route path="verify-email" element={userInfo ? <VerifyEmail /> : <Navigate to={`/${lng}/login`} />} />

        <Route
          path="settings"
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<SettingsPage {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<NotificationsPage {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />

        <Route
          path="shared-calendars"
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<SharedList {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />
        <Route path="accept-invite" index element={<PrivateRoute element={<AcceptInvitePage {...sharedProps} />} />} />
        <Route path="add-calendar">
          <Route index element={<PrivateRoute element={<AddCalendarPage {...sharedProps} />} />} />
          <Route path="review" element={<PrivateRoute element={<MedicineReview {...sharedProps} />} />} />
        </Route>

        <Route path="calendar/:calendarId">
          {PrivateCalendarSubRoutes({ sharedProps, isInitialLoading })}
        </Route>

        <Route
          path="calendars"
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<CalendarList {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />

        <Route path="shared-user-calendar/:calendarId">
          {PrivateCalendarSubRoutes({ sharedProps, isInitialLoading })}
        </Route>

        <Route path="shared-token-calendar/:sharedToken">
          <Route index element={<CalendarView {...sharedProps} />} />
          {/* TODO: MedicinesList page removed — recreate or replace */}
          <Route path="pillbox" element={<PillboxPage {...sharedProps} />} />
        </Route>

        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="*" element={<NotFound />} />
        <Route
          path=""
          element={userInfo ? <Navigate to={`/${lng}/calendars`} /> : <Navigate to={`/${lng}/home`} />}
        />

        <Route path="auth/callback" element={<AuthCallback />} />
      </Routes>
    </Suspense>
  );
}
