import { useLocation } from 'react-router-dom';
import { stripLangPrefix } from '@meditime/utils';
import {
  useRealtimeCalendars,
  useRealtimeSharedCalendars,
} from '../../hooks/realtime/useRealtimeCalendars';
import { useRealtimeNotifications } from '../../hooks/realtime/useRealtimeNotifications';
import { useRealtimeTokens } from '../../hooks/realtime/useRealtimeTokens';
import type { RealtimeManagerProps } from '@meditime/types';

export default function RealtimeManager({
  setCalendarsData,
  setSharedCalendarsData,
  setNotificationsData,
  setTokensList,
  setLoadingStates,
  calendarsData,
  sharedCalendarsData,
}: RealtimeManagerProps) {
  const location = useLocation();

  // Liste blanche des routes où on active le realtime
  const enabledRoutes = [
    '/calendars',
    '/calendar/',
    '/shared-user-calendar/',
    '/shared-token-calendar/',
    '/notifications',
    '/account',
    '/settings',
    '/shared-calendars',
    '/accept-invite',
    '/add-calendar',
  ];

  // strip possible language prefix (e.g. /fr) before matching routes
  const pathWithoutLang = stripLangPrefix(location.pathname);

  const isRealtimeEnabled = enabledRoutes.some((route) =>
    pathWithoutLang.startsWith(route)
  );

  // ✅ Appel des hooks (OK car toujours dans un composant monté dans <Router>)
  useRealtimeCalendars(
    isRealtimeEnabled ? setCalendarsData : null,
    setLoadingStates,
    calendarsData ?? undefined
  );
  useRealtimeSharedCalendars(
    isRealtimeEnabled ? setSharedCalendarsData : null,
    setLoadingStates,
    sharedCalendarsData ?? undefined
  );
  useRealtimeNotifications(
    isRealtimeEnabled ? setNotificationsData : null,
    setLoadingStates
  );
  useRealtimeTokens(
    isRealtimeEnabled ? setTokensList : null,
    setLoadingStates
  );

  return null; // pas de rendu visuel, juste des hooks
}
