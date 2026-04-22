import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { INVITE_TYPES } from '@meditime/constants';
import { createSharedUserCalendarsApi, getFirstRouteParam, performApiCall } from '@meditime/utils';
import type { SharedInvitation, SharedInvitationResult } from '@meditime/types';
import { useAuth } from '../auth/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function useAcceptInvite() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[]; type?: string | string[] }>();
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<SharedInvitation | null>(null);
  const [notFound, setNotFound] = useState(false);

  const token = getFirstRouteParam(params.token) ?? '';
  const type = getFirstRouteParam(params.type) ?? '';

  const apiOptions = useMemo(
    () => ({
      apiUrl: API_URL,
      uid: userInfo?.uid ?? null,
      showAlert: null,
      performApiCall,
    }),
    [userInfo?.uid],
  );

  const sharedUserCalendarsApi = useMemo(
    () => createSharedUserCalendarsApi(apiOptions),
    [apiOptions],
  );

  const inviteApi = useMemo(() => {
    if (type === INVITE_TYPES.LOGIN) {
      return {
        get: sharedUserCalendarsApi.getLoginInvitation,
        accept: sharedUserCalendarsApi.acceptLoginInvitation,
        reject: sharedUserCalendarsApi.rejectLoginInvitation,
      };
    }

    if (type === INVITE_TYPES.REGISTRATION) {
      return {
        get: sharedUserCalendarsApi.getRegistrationInvitation,
        accept: sharedUserCalendarsApi.acceptRegistrationInvitation,
        reject: sharedUserCalendarsApi.rejectRegistrationInvitation,
      };
    }

    return null;
  }, [sharedUserCalendarsApi, type]);

  useEffect(() => {
    let active = true;

    const loadInvitation = async () => {
      if (!token || !inviteApi) {
        setInvitation(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const result = await inviteApi.get(token) as SharedInvitationResult;
        if (!active) return;

        if (result.success) {
          setInvitation(result.invitation ?? null);
          return;
        }

        setInvitation(null);
        if (result.status === 404) {
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInvitation();

    return () => {
      active = false;
    };
  }, [inviteApi, token]);

  const handleAccept = useCallback(async () => {
    if (!inviteApi) return;
    setLoading(true);

    try {
      const result = await inviteApi.accept(token);
      if (result.success && result.calendar_id) {
        router.push(`/calendars/shared-user-calendar/${result.calendar_id}` as never);
      }
    } finally {
      setLoading(false);
    }
  }, [inviteApi, router, token]);

  const handleReject = useCallback(async () => {
    if (!inviteApi) return;
    setLoading(true);

    try {
      const result = await inviteApi.reject(token);
      if (result.success) {
        router.push('/calendars' as never);
      }
    } finally {
      setLoading(false);
    }
  }, [inviteApi, router, token]);

  return {
    handleAccept,
    handleReject,
    invitation,
    loading,
    notFound,
    title: String(t('invitation.title')),
  };
}
