import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RouteWithLoader from './RouteWithLoader';
import type { AppSharedProps } from '@meditime/types';

const CalendarView = lazy(() => import('../pages/calendars/calendar/CalendarView'));
const PillboxPage = lazy(() => import('../pages/calendars/calendar/pillbox/Pillbox'));
const DailyCalendarPage = lazy(() => import('../pages/calendars/calendar/DailyCalendarPage'));
const CalendarSettingsPage = lazy(() => import('../pages/calendars/calendar/settings/CalendarSettingsPage'));
const BoxesView = lazy(() => import('../pages/calendars/calendar/medicines/BoxesView'));
const StockAlertsPage = lazy(() => import('../pages/calendars/calendar/medicines/StockAlertsPage'));
const PillboxUses = lazy(() => import('../pages/calendars/calendar/pillbox/PillboxUses'));
const IcsList = lazy(() => import('../pages/calendars/calendar/medicines/IcsList'));
const MissedIntakesPage = lazy(() => import('../pages/calendars/calendar/medicines/MissedIntakesPage'));
const MissedIntakesRecapPage = lazy(() => import('../pages/calendars/calendar/medicines/MissedIntakesRecapPage'));

export default function PrivateCalendarSubRoutes({ sharedProps, isInitialLoading }: { sharedProps: AppSharedProps; isInitialLoading: boolean }): ReactElement {
  return (
    <>
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
      <Route path="missed-intakes">
        <Route
          index
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<MissedIntakesPage {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />
        <Route
          path="recap"
          element={
            <PrivateRoute
              element={<RouteWithLoader element={<MissedIntakesRecapPage {...sharedProps} />} isLoading={isInitialLoading} />}
            />
          }
        />
      </Route>
    </>
  );
}
