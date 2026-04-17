import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { detectCalendarType, getCalendarSourceMap } from '@meditime/utils';
import { CALENDAR_SETTINGS_TABS } from '@meditime/constants';
import type { CalendarSettingsPageProps, CalendarSettingsTab } from '@meditime/types';

export function useCalendarSettings({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: CalendarSettingsPageProps) {
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { lng } = params;

  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const [notFound, setNotFound] = useState(false);

  const getInitialTab = (): CalendarSettingsTab | null => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab') as CalendarSettingsTab | null;

    if (tab) return tab;

    switch (calendarType) {
      case 'personal':
        return CALENDAR_SETTINGS_TABS.STOCK;
      case 'sharedUser':
        return CALENDAR_SETTINGS_TABS.NOTIFICATIONS;
      default:
        return null;
    }
  };

  const [activeTab, setActiveTab] = useState<CalendarSettingsTab | null>(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  const sharedProps = {
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars,
  };

  return {
    lng,
    calendarType,
    calendarId,
    basePath,
    activeTab,
    notFound,
    setNotFound,
    sharedProps,
  };
}
