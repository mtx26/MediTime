import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import type { IcsListPageProps, IcsSource, IcsTokenEntry } from '@meditime/types';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export function getWebcalUrl(token: string) {
  const url = `${VITE_API_URL}/api/calendar/${token}.ics`;
  return url.replace(/^https?:\/\//, 'webcal://');
}

export function useIcsList({ personalCalendars, sharedUserCalendars, tokenCalendars }: IcsListPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();

  const [tokens, setTokens] = useState<IcsTokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();
  const { showLoading } = useLoading();
  const [notFound, setNotFound] = useState(false);

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as IcsSource;

  const fetchTokens = async () => {
    setLoading(true);
    const result = await calendarSource.getTokensIcs(calendarId);
    if (result.success) {
      setTokens(result.data?.tokens || []);
    } else if (result.status === 404) {
      setNotFound(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, [calendarId]);

  const handleCreateToken = async () => {
    const result = await calendarSource.createTokenIcs(calendarId);
    if (result.success) {
      fetchTokens();
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    const result = await calendarSource.deleteTokenIcs(calendarId, tokenId);
    if (result.success) {
      fetchTokens();
    }
  };

  const openDeleteActionSheet = (token: IcsTokenEntry) => {
    showConfirm(
      'confirm-danger',
      t('ics.delete_title'),
      t('ics.delete_description'),
      () => {
        void handleDeleteToken(token.id);
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('success', t('link_copied'));
    }).catch(() => {
      showAlert('danger', t('copy_link_error'));
    });
  };

  useEffect(() => {
    showLoading(loading, t('ics.loading_ics_tokens'));
  }, [loading, showLoading, t]);

  return {
    tokens,
    notFound,
    handleCreateToken,
    openDeleteActionSheet,
    copyToClipboard,
  };
}
