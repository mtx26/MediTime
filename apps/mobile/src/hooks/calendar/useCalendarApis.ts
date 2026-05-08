import { useMemo } from 'react';
import {
  createPersonalCalendarsApi,
  createSharedUserCalendarsApi,
  performApiCall,
} from '@meditime/utils';
import { useAuth } from '../auth/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function useCalendarApis() {
  const { userInfo } = useAuth();

  const apiOptions = useMemo(
    () => ({
      apiUrl: API_URL,
      uid: userInfo?.uid ?? null,
      showAlert: null,
      performApiCall,
    }),
    [userInfo?.uid],
  );

  return useMemo(
    () => ({
      apiUrl: API_URL,
      personalCalendarsApi: createPersonalCalendarsApi(apiOptions),
      sharedUserCalendarsApi: createSharedUserCalendarsApi(apiOptions),
    }),
    [apiOptions],
  );
}
