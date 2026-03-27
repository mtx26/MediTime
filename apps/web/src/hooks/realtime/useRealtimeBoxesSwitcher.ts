// useRealtimeBoxesSwitcher.js
import type { Dispatch, SetStateAction } from 'react';
import type { BoxItem } from '@meditime/types';
import {
  useRealtimePersonalBoxes,
  useRealtimeSharedBoxes,
} from './useRealtimeBoxes';

type CalendarType = 'personal' | 'sharedUser' | string;

export const useRealtimeBoxesSwitcher = (
  calendarType: CalendarType,
  calendarId: string | null,
  setBoxes: Dispatch<SetStateAction<BoxItem[]>>,
  setLoadingBoxes: Dispatch<SetStateAction<boolean | undefined>>,
  setRep: Dispatch<SetStateAction<Response | null>>
): void => {
  // Appels inconditionnels
  const isPersonal = calendarType === 'personal';
  const isShared = calendarType === 'sharedUser';

  useRealtimePersonalBoxes(
    isPersonal ? calendarId : null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );
  useRealtimeSharedBoxes(
    isShared ? calendarId : null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );
};
