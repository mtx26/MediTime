import { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { useAlert } from '@/contexts/AlertContext';
import { UserContext } from '@/contexts/UserContext';
import { getMondayDate, detectCalendarType, getCalendarSourceMap } from '@meditime/utils';
import type {
  PillboxSource,
  PillboxUseItem,
  PillboxUsesPageProps,
} from '@meditime/types';

export function usePillboxUses({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: PillboxUsesPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { lng } = params;

  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo;
  const { showConfirm } = useAlert();

  const [pillboxUses, setPillboxUses] = useState<PillboxUseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars,
  )[calendarType] as unknown as PillboxSource;

  const fetchData = async () => {
    if (!calendarId) return setLoading(true);
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) return setLoading(true);
    }
    const rep = await calendarSource.fetchPillboxUses(calendarId);
    if (rep.success) {
      setPillboxUses(rep.pillbox_uses ?? []);
      setLoading(false);
    } else {
      console.error('Error fetching pillbox uses:', rep.status);
      if (rep.status === 404) {
        setNotFound(true);
      }
      setLoading(false);
    }
  };

  const cancelUse = (useId: string) => {
    if (!calendarId) return;
    showConfirm(
      'confirm-safe',
      t('restore_pillbox_title'),
      t('restore_pillbox_description'),
      async () => {
        const res = await calendarSource.cancelUse(calendarId, useId);
        if (res.success) {
          setLoading(true);
          void fetchData();
        }
      },
    );
  };

  const formatWeek = (dateString: string) => {
    const date = new Date(dateString);
    const monday = getMondayDate(date);
    if (!monday) return dateString;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const locale = lng ?? 'en';
    return `${monday.toLocaleDateString(locale, options)} - ${sunday.toLocaleDateString(locale, options)}`;
  };

  const sortedUses = [...pillboxUses].sort(
    (a, b) => new Date(b.prepared_at).getTime() - new Date(a.prepared_at).getTime(),
  );

  useEffect(() => {
    void fetchData();
  }, [calendarId, calendarType, userInfo]);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(loading === true && calendarId), t('loading_pillbox_uses'));
  }, [loading, calendarId, showLoading, t, notFound]);

  return {
    loading,
    notFound,
    calendarId,
    sortedUses,
    cancelUse,
    formatWeek,
  };
}
