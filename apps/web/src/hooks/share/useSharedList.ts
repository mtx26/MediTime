import { useEffect, useContext, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { UserContext } from '@/contexts/UserContext';
import { DEMO_CALENDAR_ID } from '@meditime/constants';
import type {
  SharedListPageProps,
  GroupedSharedCalendars,
  GroupedSharedCalendarsResult,
} from '@meditime/types';

export function useSharedList({
  tokenCalendars,
  personalCalendars,
  sharedUserCalendars,
}: SharedListPageProps) {
  const { t } = useTranslation();
  const userContext = useContext(UserContext) as { userInfo?: unknown } | null;
  const userInfo = userContext?.userInfo;

  const [searchParams, setSearchParams] = useSearchParams();
  const calendarFromURL = searchParams.get('calendar');

  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true);
  const [groupedShared, setGroupedShared] = useState<GroupedSharedCalendars>({});
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const refreshGroupedShared = useCallback(async () => {
    if (calendarFromURL === DEMO_CALENDAR_ID) {
      setGroupedShared({
        [DEMO_CALENDAR_ID]: {
          calendar_name: t('tour.calendar_name'),
          users: [
            { email: 'doctor@example.com', receiver_name: 'Dr. Smith', accepted: true, permission: 'read', receiver_photo_url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg', token: 'demo-user-1' },
            { email: 'family@example.com', receiver_name: 'Family Member', accepted: false, permission: 'write', receiver_photo_url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg', token: 'demo-user-2' },
          ],
          tokens: [
            { id: 'demo-token-1', token: 'demo-link-123', permission: 'read', expires_at: null, is_revoked: false },
          ],
        },
      });
      setLoadingGroupedShared(false);
      return;
    }

    setLoadingGroupedShared(true);
    const rep = await sharedUserCalendars.fetchGroupedSharedCalendars() as GroupedSharedCalendarsResult;
    setGroupedShared(rep.success ? rep.grouped : {});
    setLoadingGroupedShared(false);
  }, [sharedUserCalendars, t, calendarFromURL]);

  useEffect(() => {
    if ((userInfo && personalCalendars.calendarsData) || calendarFromURL === DEMO_CALENDAR_ID) {
      refreshGroupedShared();
    }
  }, [userInfo, personalCalendars.calendarsData, tokenCalendars.tokensList]);

  useEffect(() => {
    if (calendarFromURL === DEMO_CALENDAR_ID) {
      setSelectedCalendarId(DEMO_CALENDAR_ID);
      return;
    }
    const existsInList = personalCalendars.calendarsData?.some(
      (c) => String(c.id) === String(calendarFromURL),
    );
    if (calendarFromURL && existsInList) {
      setSelectedCalendarId(calendarFromURL);
    } else if (personalCalendars.calendarsData && personalCalendars.calendarsData.length > 0) {
      const first = String(personalCalendars.calendarsData[0].id);
      setSelectedCalendarId(first);
      setSearchParams({ calendar: first });
    }
  }, [personalCalendars, calendarFromURL, setSearchParams]);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loadingGroupedShared, t('loading_calendars'));
  }, [loadingGroupedShared, showLoading, t]);

  return {
    loadingGroupedShared,
    groupedShared,
    selectedCalendarId,
    setSelectedCalendarId,
    calendarFromURL,
    refreshGroupedShared,
  };
}
