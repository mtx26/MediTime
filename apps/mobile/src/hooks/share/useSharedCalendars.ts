import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import {
  buildPersonalCalendarActions,
  createPersonalCalendarsApi,
  createSharedUserCalendarsApi,
  createTokenCalendarsApi,
  fetchCalendars,
  getFirstRouteParam,
  performApiCall,
} from '@meditime/utils';
import { DEMO_CALENDAR_ID } from '@meditime/constants';
import type {
  CalendarItem,
  GroupedSharedCalendars,
  GroupedSharedCalendarsResult,
  SharedCalendarToken,
} from '@meditime/types';
import { useAuth } from '../auth/useAuth';
import { toActionSheetItems, toMobileHref } from '../../utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? '';

export function useSharedCalendars() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ calendar?: string | string[] }>();
  const calendarFromParams = getFirstRouteParam(params.calendar);
  const isDemoCalendar = calendarFromParams === DEMO_CALENDAR_ID;
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const [personalCalendars, setPersonalCalendars] = useState<CalendarItem[]>([]);
  const [groupedShared, setGroupedShared] = useState<GroupedSharedCalendars>({});
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailToInvite, setEmailToInvite] = useState('');

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
  const tokenCalendarsApi = useMemo(() => createTokenCalendarsApi(apiOptions), [apiOptions]);

  const refreshGroupedShared = useCallback(async () => {
    if (isDemoCalendar) {
      setGroupedShared({
        [DEMO_CALENDAR_ID]: {
          calendar_name: String(t('tour.calendar_name')),
          users: [
            {
              email: 'doctor@example.com',
              receiver_name: 'Dr. Smith',
              accepted: true,
              permission: 'read',
              receiver_photo_url: '',
              token: 'demo-user-1',
            },
            {
              email: 'family@example.com',
              receiver_name: 'Family Member',
              accepted: false,
              permission: 'write',
              receiver_photo_url: '',
              token: 'demo-user-2',
            },
          ],
          tokens: [
            {
              id: 'demo-token-1',
              token: 'demo-link-123',
              permission: 'read',
              expires_at: null,
              is_revoked: false,
            },
          ],
        },
      });
      return;
    }

    const result = await sharedUserCalendarsApi.fetchGroupedSharedCalendars() as GroupedSharedCalendarsResult;
    setGroupedShared(result.success ? result.grouped : {});
  }, [isDemoCalendar, sharedUserCalendarsApi, t]);

  const loadPage = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
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
      setPersonalCalendars(calendars);
      await refreshGroupedShared();
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(t('loading_share')));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [refreshGroupedShared, t, userInfo?.uid]);

  useEffect(() => {
    if (isAuthLoading) return;
    void loadPage();
  }, [isAuthLoading, loadPage]);

  useEffect(() => {
    if (calendarFromParams === DEMO_CALENDAR_ID) {
      setSelectedCalendarIdState(DEMO_CALENDAR_ID);
      return;
    }

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

  const selectedCalendar = useMemo(
    () => personalCalendars.find((calendar) => calendar.id === selectedCalendarId) ?? null,
    [personalCalendars, selectedCalendarId],
  );

  const selectedSharedData = useMemo(
    () => (selectedCalendarId ? groupedShared[selectedCalendarId] ?? null : null),
    [groupedShared, selectedCalendarId],
  );

  const navigateToHref = useCallback((href: string) => {
    router.push(toMobileHref(href) as never);
  }, [router]);

  const setSelectedCalendarId = useCallback((calendarId: string) => {
    setSelectedCalendarIdState(calendarId);
    router.setParams({ calendar: calendarId });
  }, [router]);

  const openCalendarPdf = useCallback(async () => {
    if (!selectedCalendarId) return;

    try {
      await WebBrowser.openBrowserAsync(
        personalCalendarsApi.getPersonalCalendarPdfUrl(selectedCalendarId, false),
        {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        },
      );
    } catch {
      Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
    }
  }, [personalCalendarsApi, selectedCalendarId, t]);

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

  const shareLink = useCallback(async (token: SharedCalendarToken) => {
    const language = (i18n.language || 'fr').slice(0, 2);
    const url = `${WEB_URL}/${language}/shared-token-calendar/${token.id}`;
    await Share.share({
      message: url,
      url,
      title: String(t('copy_link')),
    });
  }, [i18n.language, t]);

  const createPublicLink = useCallback(() => {
    if (!selectedCalendarId) return;

    void tokenCalendarsApi.createToken(selectedCalendarId, null, 'read').then((result) => {
      if (!result.success) {
        Alert.alert(String(t('error')), result.error ?? String(t('error')));
        return;
      }

      void refreshGroupedShared();
    });
  }, [refreshGroupedShared, selectedCalendarId, t, tokenCalendarsApi]);

  const deletePublicLink = useCallback((tokenId: string) => {
    Alert.alert(
      String(t('delete_link_title')),
      String(t('delete_link_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void tokenCalendarsApi.deleteToken(tokenId).then((result) => {
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
  }, [refreshGroupedShared, t, tokenCalendarsApi]);

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
          lng: (i18n.language || 'fr').slice(0, 2),
          basePath: 'calendar',
          selectedDate: null,
        },
        {
          onRename: undefined,
          onDelete: deleteCalendar,
          onExportPdf: () => void openCalendarPdf(),
        },
        ['rename'],
      ),
      (key) => String(t(key)),
    );
  }, [deleteCalendar, i18n.language, openCalendarPdf, selectedCalendarId, t]);

  return {
    actions,
    emailToInvite,
    error,
    isAuthLoading,
    isLoading,
    isRefreshing,
    navigateToHref,
    personalCalendars,
    refresh: () => void loadPage('refresh'),
    selectedCalendar,
    selectedCalendarId,
    selectedSharedData,
    setEmailToInvite,
    setSelectedCalendarId,
    shareLink,
    createPublicLink,
    deletePublicLink,
    sendInvitation,
    deleteLoginInvitation,
    deleteRegistrationInvitation,
    userInfo,
  };
}
