import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Share } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getWebcalUrl } from '@meditime/utils';
import type {
  ApiResult,
  CalendarDetailSourceType,
  IcsTokenEntry,
  IcsTokensResult,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';

type IcsSource = {
  getTokensIcs: (calendarId: string) => Promise<ApiResult>;
  createTokenIcs: (calendarId: string) => Promise<ApiResult>;
  deleteTokenIcs: (calendarId: string, tokenId: string) => Promise<ApiResult>;
};

export function useIcsTokens(sourceType: CalendarDetailSourceType) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { apiUrl, personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const [tokens, setTokens] = useState<IcsTokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source: IcsSource = useMemo(
    () => sourceType === 'personal'
      ? {
          getTokensIcs: personalCalendarsApi.getTokensIcs,
          createTokenIcs: personalCalendarsApi.createTokenIcs,
          deleteTokenIcs: personalCalendarsApi.deleteTokenIcs,
        }
      : {
          getTokensIcs: sharedUserCalendarsApi.getSharedTokensIcs,
          createTokenIcs: sharedUserCalendarsApi.createSharedTokenIcs,
          deleteTokenIcs: sharedUserCalendarsApi.deleteSharedTokenIcs,
        },
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const loadTokens = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await source.getTokensIcs(calendarId) as IcsTokensResult;
      if (result.success) {
        setTokens(result.data?.tokens ?? []);
        setNotFound(false);
        return;
      }

      if (result.status === 404) {
        setNotFound(true);
        return;
      }

      setError(result.error ?? String(t('ics.fetch_error')));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('ics.fetch_error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarId, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadTokens();
    }, [loadTokens]),
  );

  const createToken = async () => {
    if (!calendarId) return;

    setIsMutating(true);
    try {
      const result = await source.createTokenIcs(calendarId);
      if (result.success) {
        await loadTokens('refresh');
        return;
      }

      Alert.alert(String(t('ics.create_error')), result.error ?? String(t('ics.create_error')));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteToken = async (token: IcsTokenEntry) => {
    if (!calendarId) return;

    setIsMutating(true);
    try {
      const result = await source.deleteTokenIcs(calendarId, token.id);
      if (result.success) {
        await loadTokens('refresh');
        return;
      }

      Alert.alert(String(t('ics.delete_error')), result.error ?? String(t('ics.delete_error')));
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDeleteToken = (token: IcsTokenEntry) => {
    Alert.alert(
      String(t('ics.delete_title')),
      String(t('ics.delete_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void deleteToken(token);
          },
        },
      ],
    );
  };

  const getHttpsCalendarUrl = (url: string) => url.replace(/^webcal:\/\//, 'https://');

  const subscribeToken = (url: string) => {
    void Linking.openURL(url).catch(() => {
      void Linking.openURL(getHttpsCalendarUrl(url)).catch(() => {
        Alert.alert(String(t('ics.sync_error')), String(t('ics.sync_error_description', { url })));
      });
    });
  };

  const shareToken = (url: string) => {
    void Share.share({ message: url, url }).catch(() => {
      Alert.alert(String(t('copy_link_error')), url);
    });
  };

  const getTokenUrl = (token: string) => getWebcalUrl(apiUrl, token);

  return {
    backToCalendars: () => router.dismissTo('/calendars' as never),
    confirmDeleteToken,
    createToken,
    error,
    getTokenUrl,
    isMutating,
    loading,
    loadTokens,
    notFound,
    refreshing,
    shareToken,
    subscribeToken,
    tokens,
  };
}
