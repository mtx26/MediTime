import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  buildPersonalCalendarActions,
  createPersonalCalendarsApi,
  createSharedUserCalendarsApi,
  fetchCalendars,
  getFirstRouteParam,
  performApiCall,
} from '@meditime/utils';
import type {
  CalendarItem,
  GroupedSharedCalendars,
  GroupedSharedCalendarsResult,
} from '@meditime/types';
import { useAuth } from '../auth/useAuth';
import { openPdfUrl, toActionSheetItems } from '../../utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const isActiveDefault = () => true;

export function useSharedCalendars() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ calendar?: string | string[] }>();
  const calendarFromParams = getFirstRouteParam(params.calendar);
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const [personalCalendars, setPersonalCalendars] = useState<CalendarItem[]>([]);
  const [groupedShared, setGroupedShared] = useState<GroupedSharedCalendars>({});
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailToInvite, setEmailToInvite] = useState('');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

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

  const refreshGroupedShared = useCallback(async (isActive: () => boolean = isActiveDefault) => {
    const result = await sharedUserCalendarsApi.fetchGroupedSharedCalendars() as GroupedSharedCalendarsResult;
    if (!isActive()) return;

    setGroupedShared(result.success ? result.grouped : {});
  }, [sharedUserCalendarsApi]);

  const loadPage = useCallback(async (
    mode: 'initial' | 'refresh' = 'initial',
    isActive: () => boolean = isActiveDefault,
  ) => {
    if (!userInfo?.uid) {
      setPersonalCalendars([]);
      setGroupedShared({});
      setSelectedCalendarIdState(null);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const calendars = await fetchCalendars(API_URL);
      if (!isActive()) return;

      setPersonalCalendars(calendars);
      await refreshGroupedShared(isActive);
      if (!isActive()) return;

      setError(null);
    } catch (loadError) {
      if (!isActive()) return;
      setError(loadError instanceof Error ? loadError.message : String(t('loading_share')));
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [refreshGroupedShared, t, userInfo?.uid]);

  useEffect(() => {
    if (isAuthLoading) return;

    let active = true;
    void loadPage('initial', () => active);

    return () => {
      active = false;
    };
  }, [isAuthLoading, loadPage]);

  useEffect(() => {
    const exists = personalCalendars.some((calendar) => calendar.id === calendarFromParams);
    if (calendarFromParams && exists) {
      setSelectedCalendarIdState(calendarFromParams);
      return;
    }

    const firstCalendarId = personalCalendars[0]?.id;
    if (firstCalendarId) {
      setSelectedCalendarIdState(firstCalendarId);
      router.setParams({ calendar: firstCalendarId });
      return;
    }

    setSelectedCalendarIdState(null);
  }, [calendarFromParams, personalCalendars, router]);

  const selectedSharedData = useMemo(
    () => (selectedCalendarId ? groupedShared[selectedCalendarId] ?? null : null),
    [groupedShared, selectedCalendarId],
  );

  const navigateToHref = useCallback((href: string) => {
    router.push(href as never);
  }, [router]);

  const setSelectedCalendarId = useCallback((calendarId: string) => {
    setSelectedCalendarIdState(calendarId);
    router.setParams({ calendar: calendarId });
  }, [router]);

  const openCalendarPdf = useCallback(async () => {
    if (!selectedCalendarId) return;

    try {
      await openPdfUrl(personalCalendarsApi.getPersonalCalendarPdfUrl(selectedCalendarId, includeInactive));
      setPdfDialogOpen(false);
    } catch {
      Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
    }
  }, [includeInactive, personalCalendarsApi, selectedCalendarId, t]);

  const openPdfDialog = useCallback(() => {
    if (!selectedCalendarId) return;
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  }, [selectedCalendarId]);

  const deleteCalendar = useCallback(() => {
    if (!selectedCalendarId) return;

    Alert.alert(
      String(t('calendar.delete_title')),
      String(t('calendar.delete_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void personalCalendarsApi.deleteCalendar(selectedCalendarId).then((result) => {
              if (!result.success) {
                Alert.alert(String(t('error')), result.error ?? String(t('error')));
                return;
              }

              void loadPage('refresh');
            });
          },
        },
      ],
    );
  }, [loadPage, personalCalendarsApi, selectedCalendarId, t]);

  const sendInvitation = useCallback(() => {
    if (!selectedCalendarId) return;
    const email = emailToInvite.trim();
    if (!email) return;

    void sharedUserCalendarsApi.sendInvitation(email, selectedCalendarId).then((result) => {
      if (!result.success) {
        Alert.alert(String(t('error')), result.error ?? String(t('error')));
        return;
      }

      setEmailToInvite('');
      void refreshGroupedShared();
    });
  }, [emailToInvite, refreshGroupedShared, selectedCalendarId, sharedUserCalendarsApi, t]);

  const deleteLoginInvitation = useCallback((token: string) => {
    Alert.alert(
      String(t('delete_access_title')),
      String(t('delete_access_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void sharedUserCalendarsApi.deleteLoginInvitation(token).then((result) => {
              if (!result.success) {
                Alert.alert(String(t('error')), result.error ?? String(t('error')));
                return;
              }

              void refreshGroupedShared();
            });
          },
        },
      ],
    );
  }, [refreshGroupedShared, sharedUserCalendarsApi, t]);

  const deleteRegistrationInvitation = useCallback((token: string) => {
    Alert.alert(
      String(t('delete_invitation_title')),
      String(t('delete_invitation_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void sharedUserCalendarsApi.deleteRegistrationInvitation(token).then((result) => {
              if (!result.success) {
                Alert.alert(String(t('error')), result.error ?? String(t('error')));
                return;
              }

              void refreshGroupedShared();
            });
          },
        },
      ],
    );
  }, [refreshGroupedShared, sharedUserCalendarsApi, t]);

  const actions = useMemo(() => {
    if (!selectedCalendarId) return [];

    return toActionSheetItems(
      buildPersonalCalendarActions(
        {
          calendarId: selectedCalendarId,
          basePath: 'calendars/calendar',
          selectedDate: null,
        },
        {
          onRename: undefined,
          onDelete: deleteCalendar,
          onExportPdf: openPdfDialog,
        },
        ['rename'],
      ),
      (key) => String(t(key)),
    );
  }, [deleteCalendar, openPdfDialog, selectedCalendarId, t]);

  return {
    actions,
    emailToInvite,
    error,
    isAuthLoading,
    isLoading,
    isRefreshing,
    navigateToHref,
    personalCalendars,
    pdfDialogOpen,
    refresh: () => void loadPage('refresh'),
    selectedCalendarId,
    selectedSharedData,
    setEmailToInvite,
    setIncludeInactive,
    setPdfDialogOpen,
    setSelectedCalendarId,
    sendInvitation,
    deleteLoginInvitation,
    deleteRegistrationInvitation,
    userInfo,
    includeInactive,
    openCalendarPdf,
  };
}
