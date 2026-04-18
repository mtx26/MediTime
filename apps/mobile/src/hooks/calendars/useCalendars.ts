import { useCallback, useMemo, useState } from 'react';
import {
  createPersonalCalendarsApi,
  createSharedUserCalendarsApi,
  fetchCalendars,
  fetchSharedCalendars,
  performApiCall,
} from '@meditime/utils';
import type {
  ApiResult,
  CalendarItem,
  MedicineReviewConditionInput,
  MedicineReviewMedicineInput,
  PersonalBoxResult,
} from '@meditime/types';
import { useAuth } from '../auth/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function useCalendars() {
  const { userInfo } = useAuth();
  const [personalCalendars, setPersonalCalendars] = useState<CalendarItem[]>([]);
  const [sharedCalendars, setSharedCalendars] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiOptions = useMemo(
    () => ({
      apiUrl: API_URL,
      uid: userInfo?.uid ?? null,
      showAlert: null,
      performApiCall,
    }),
    [userInfo?.uid],
  );

  const personalCalendarsApi = useMemo(() => createPersonalCalendarsApi(apiOptions), [apiOptions]);
  const sharedUserCalendarsApi = useMemo(() => createSharedUserCalendarsApi(apiOptions), [apiOptions]);

  const loadCalendars = useCallback(async () => {
    if (!API_URL) {
      setError('API URL missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [personal, shared] = await Promise.all([
        fetchCalendars(API_URL),
        fetchSharedCalendars(API_URL),
      ]);

      setPersonalCalendars(personal);
      setSharedCalendars(shared);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calendars loading failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCalendar = useCallback(
    async (name: string): Promise<ApiResult> => {
      setIsMutating(true);
      try {
        const result = await personalCalendarsApi.addCalendar(name);
        if (result.success) {
          await loadCalendars();
        }
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [loadCalendars, personalCalendarsApi],
  );

  const deleteCalendar = useCallback(
    async (calendarId: string): Promise<ApiResult> => {
      setIsMutating(true);
      try {
        const result = await personalCalendarsApi.deleteCalendar(calendarId);
        if (result.success) {
          await loadCalendars();
        }
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [loadCalendars, personalCalendarsApi],
  );

  const renameCalendar = useCallback(
    async (calendarId: string, newName: string): Promise<ApiResult> => {
      setIsMutating(true);
      try {
        const result = await personalCalendarsApi.renameCalendar(calendarId, newName);
        if (result.success) {
          await loadCalendars();
        }
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [loadCalendars, personalCalendarsApi],
  );

  const createPersonalBox = useCallback(
    async (
      calendarId: string,
      name: string,
      boxCapacity: number,
      stockAlertThreshold: number,
      stockQuantity: number,
      dose: number | string | null,
      conditions: MedicineReviewConditionInput[] = [],
      codeFmd: string | null = null,
    ): Promise<PersonalBoxResult> => {
      setIsMutating(true);
      try {
        return await personalCalendarsApi.createPersonalBox(
          calendarId,
          name,
          boxCapacity,
          stockAlertThreshold,
          stockQuantity,
          dose,
          conditions,
          codeFmd,
        );
      } finally {
        setIsMutating(false);
      }
    },
    [personalCalendarsApi],
  );

  const analyzeImageBase64 = useCallback(
    async (base64: string): Promise<ApiResult & { medicines?: MedicineReviewMedicineInput[] }> => {
      setIsMutating(true);
      try {
        return await performApiCall({
          url: `${API_URL}/api/documents/analyze`,
          method: 'POST',
          body: { image: base64 },
          origin: 'DOCUMENT_ANALYZE',
          uid: userInfo?.uid ?? null,
          analyticsEvent: 'DOCUMENT_ANALYZE',
          analyticsData: { uid: userInfo?.uid ?? null },
          showAlert: null,
        }) as ApiResult & { medicines?: MedicineReviewMedicineInput[] };
      } finally {
        setIsMutating(false);
      }
    },
    [userInfo?.uid],
  );

  const saveAnalysisResult = useCallback(
    async (
      calendarName: string,
      boxes: MedicineReviewMedicineInput[],
    ): Promise<ApiResult & { calendar_id?: string }> => {
      setIsMutating(true);
      try {
        const result = await performApiCall({
          url: `${API_URL}/api/documents/analyze/save`,
          method: 'POST',
          body: { calendarName, boxes },
          origin: 'DOCUMENT_ANALYZE_SAVE',
          uid: userInfo?.uid ?? null,
          analyticsEvent: 'DOCUMENT_ANALYZE_SAVE',
          analyticsData: { uid: userInfo?.uid ?? null },
          showAlert: null,
        }) as ApiResult & { calendar_id?: string };

        if (result.success) {
          await loadCalendars();
        }

        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [loadCalendars, userInfo?.uid],
  );

  const deleteSharedCalendar = useCallback(
    async (calendarId: string): Promise<ApiResult> => {
      setIsMutating(true);
      try {
        const result = await sharedUserCalendarsApi.deleteSharedCalendar(calendarId);
        if (result.success) {
          await loadCalendars();
        }
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [loadCalendars, sharedUserCalendarsApi],
  );

  const getPersonalCalendarPdfUrl = useCallback(
    (calendarId: string, includeInactive: boolean) => {
      return personalCalendarsApi.getPersonalCalendarPdfUrl(calendarId, includeInactive);
    },
    [personalCalendarsApi],
  );

  return {
    personalCalendars,
    sharedCalendars,
    isLoading,
    isMutating,
    error,
    loadCalendars,
    addCalendar,
    deleteCalendar,
    renameCalendar,
    createPersonalBox,
    analyzeImageBase64,
    saveAnalysisResult,
    deleteSharedCalendar,
    getPersonalCalendarPdfUrl,
  };
}
