import { useRoute } from '@react-navigation/native';
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
  let route;
  let isRealtimeEnabled = false;
  
  try {
    route = useRoute();
    // Si on a une route valide, on vérifie si elle est dans la liste autorisée
    const enabledRoutes = [
      'Calendars',
      'Calendar',
      'SharedUserCalendar',
      'SharedTokenCalendar',
      'Notifications',
      'Account',
      'Settings',
      'SharedCalendars',
      'AcceptInvite',
      'AddCalendar',
    ];
    
    const currentRouteName = route?.name || '';
    isRealtimeEnabled = enabledRoutes.includes(currentRouteName);
  } catch (error) {
    // Si useRoute échoue (composant pas dans un navigator), on désactive le realtime
    route = null;
    isRealtimeEnabled = false;
  }

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
