import { useLocation } from 'react-router-dom';
import {
  useRealtimeCalendars,
  useRealtimeSharedCalendars,
} from '../../hooks/realtime/useRealtimeCalendars';
import { useRealtimeNotifications } from '../../hooks/realtime/useRealtimeNotifications';
import { useRealtimeTokens } from '../../hooks/realtime/useRealtimeTokens';
import PropTypes from 'prop-types';

export default function RealtimeManager({
  setCalendarsData,
  setSharedCalendarsData,
  setNotificationsData,
  setTokensList,
  setLoadingStates,
  calendarsData,
  sharedCalendarsData,
}) {
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

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '') || '/';

  const isRealtimeEnabled = enabledRoutes.some((route) =>
    pathWithoutLang.startsWith(route)
  );

  // ✅ Appel des hooks (OK car toujours dans un composant monté dans <Router>)
  useRealtimeCalendars(
    isRealtimeEnabled ? setCalendarsData : null,
    setLoadingStates,
    calendarsData
  );
  useRealtimeSharedCalendars(
    isRealtimeEnabled ? setSharedCalendarsData : null,
    setLoadingStates,
    sharedCalendarsData
  );
  useRealtimeNotifications(
    isRealtimeEnabled ? setNotificationsData : null,
    setLoadingStates
  );
  useRealtimeTokens(isRealtimeEnabled ? setTokensList : null, setLoadingStates);

  return null; // pas de rendu visuel, juste des hooks
}

RealtimeManager.propTypes = {
  setCalendarsData: PropTypes.func.isRequired,
  setSharedCalendarsData: PropTypes.func.isRequired,
  setNotificationsData: PropTypes.func.isRequired,
  setTokensList: PropTypes.func.isRequired,
  setLoadingStates: PropTypes.func.isRequired,
  calendarsData: PropTypes.array,
  sharedCalendarsData: PropTypes.array,
};
