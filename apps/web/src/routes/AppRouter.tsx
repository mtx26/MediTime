import { useContext, lazy, Suspense, useEffect, type ReactElement } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../contexts/UserContext';
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

const AuthCallback = lazy(async () => ({
  default: (await import('../pages/auth/AuthCallback')).default as unknown as React.ComponentType,
}));
const CalendarSettingsPage = lazy(() => import('../pages/calendars/calendar/settings/CalendarSettingsPage'));

function buildFullPath(loc: { pathname?: string; search?: string; hash?: string }): string {
  const path = loc.pathname || '/';
  const qs = loc.search || '';
  const hash = loc.hash || '';
  return `${path}${qs}${hash}`;
}

function PrivateRoute({ element }: { element: ReactElement }): ReactElement {
  const context = useContext(UserContext) as unknown as { userInfo?: unknown } | null;
  const userInfo = context?.userInfo;
  const location = useLocation();
  const { lng } = useParams();

  if (!userInfo) {
    const full = buildFullPath(location);
    return <Navigate to={`/${lng}/login?redirect=${encodeURIComponent(full)}`} replace />;
  }
  return element;
}

function SuspenseFallback(): null {
  const { showLoading } = useLoading() as { showLoading: (condition: boolean, message?: string) => void };
  const { t } = useTranslation();

  useEffect(() => {
    showLoading(true, t('loading'));
    return () => showLoading(false, '');
  }, [showLoading, t]);

  return null;
}

function RouteWithLoader({ element, isLoading }: { element: ReactElement; isLoading: boolean }): ReactElement | null {
  const { showLoading } = useLoading() as { showLoading: (condition: boolean, message?: string) => void };
  const { t } = useTranslation();

  useEffect(() => {
    showLoading(isLoading, t('loading'));
  }, [isLoading, showLoading, t]);

  if (isLoading) return null;
  return element;
}

export default function AppRoutes({ sharedProps }: { sharedProps: AppSharedProps }): ReactElement {
  const context = useContext(UserContext) as unknown as { userInfo?: unknown | null } | null;
  const userInfo = context?.userInfo || null;
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
          <Route
            index
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<CalendarView {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="boxes"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<BoxesView {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="pillbox"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<PillboxPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="daily"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<DailyCalendarPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="settings"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<CalendarSettingsPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="stock-alerts"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<StockAlertsPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="pillbox-uses"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<PillboxUses {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="ics-tokens"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<IcsList {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
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
          <Route
            index
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<CalendarView {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="boxes"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<BoxesView {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="pillbox"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<PillboxPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="daily"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<DailyCalendarPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="settings"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<CalendarSettingsPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="stock-alerts"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<StockAlertsPage {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="pillbox-uses"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<PillboxUses {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
          <Route
            path="ics-tokens"
            element={
              <PrivateRoute
                element={<RouteWithLoader element={<IcsList {...sharedProps} />} isLoading={isInitialLoading} />}
              />
            }
          />
        </Route>

        <Route path="shared-token-calendar/:sharedToken">
          <Route index element={<CalendarView {...sharedProps} />} />
          <Route path="boxes" element={<MedicinesList />} />
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
