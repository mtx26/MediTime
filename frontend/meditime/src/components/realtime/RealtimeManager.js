import React from 'react';
import {
  useRealtimeCalendars,
  useRealtimeSharedCalendars,
} from '../../hooks/realtime/useRealtimeCalendars';
import { useRealtimeNotifications } from '../../hooks/realtime/useRealtimeNotifications';
import { useRealtimeTokens } from '../../hooks/realtime/useRealtimeTokens';

export default function RealtimeManager({
  setCalendarsData,
  setSharedCalendarsData,
  setNotificationsData,
  setTokensList,
  setLoadingStates,
  calendarsData,
  sharedCalendarsData,
  isRealtimeEnabled = true, // Pour React Native, on active toujours le realtime quand l'utilisateur est connecté
}) {
  // Appel des hooks realtime
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
  
  useRealtimeTokens(
    isRealtimeEnabled ? setTokensList : null, 
    setLoadingStates
  );

  return null; // Pas de rendu visuel, juste des hooks
}
