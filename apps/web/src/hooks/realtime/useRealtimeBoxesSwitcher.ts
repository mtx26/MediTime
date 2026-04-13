// useRealtimeBoxesSwitcher.js
import type { Dispatch, SetStateAction } from 'react';
import type { BoxItem, CalendarPageSourceType } from '@meditime/types';
import {
  useRealtimePersonalBoxes,
  useRealtimeSharedBoxes,
} from './useRealtimeBoxes';

export const useRealtimeBoxesSwitcher = <T extends { name: string } = BoxItem>(
  calendarType: CalendarPageSourceType | '',
  calendarId: string | null,
  setBoxes: Dispatch<SetStateAction<T[]>>,
  setLoadingBoxes: Dispatch<SetStateAction<boolean | undefined>>,
  setRep: Dispatch<SetStateAction<Response | null>>
): void => {
  // Appels inconditionnels
  const isPersonal = calendarType === 'personal';
  const isShared = calendarType === 'sharedUser';

  useRealtimePersonalBoxes<T>(
    isPersonal ? calendarId : null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );
  useRealtimeSharedBoxes<T>(
    isShared ? calendarId : null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );
};
