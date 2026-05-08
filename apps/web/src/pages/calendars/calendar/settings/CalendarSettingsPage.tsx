import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCalendarSettings } from '@/hooks/calendars/useCalendarSettings';
import Stock from './CalendarStock';
import Notifications from './CalendarNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotFound from '@/pages/general/NotFound';
import { CALENDAR_SETTINGS_TABS } from '@meditime/constants';
import type { CalendarSettingsPageProps } from '@meditime/types';

function CalendarSettingsPage(props: CalendarSettingsPageProps) {
  const { t } = useTranslation();
  const { lng, calendarType, calendarId, basePath, activeTab, notFound, setNotFound, sharedProps } = useCalendarSettings(props);

  const renderTab = () => {
    switch (activeTab) {
      case CALENDAR_SETTINGS_TABS.STOCK:
        if (calendarType === 'personal') {
          return <Stock personalCalendars={props.personalCalendars} setNotFound={setNotFound} />;
        }
        break;
      case CALENDAR_SETTINGS_TABS.NOTIFICATIONS:
        if (calendarType !== 'token') {
          return <Notifications {...sharedProps} setNotFound={setNotFound} />;
        }
        break;
      default:
        if (calendarType === 'personal') {
          return <Stock personalCalendars={props.personalCalendars} setNotFound={setNotFound} />;
        } else if (calendarType === 'sharedUser') {
          return <Notifications {...sharedProps} setNotFound={setNotFound} />;
        }
        return null;
    }
  };

  if (notFound) return <NotFound />;

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-1/4 mb-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Settings className="inline-block mr-2 mb-1" />
                {t('calendar_settings.label')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1">
              {calendarType === 'personal' && (
                <Link
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    activeTab === CALENDAR_SETTINGS_TABS.STOCK ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                  to={`/${lng}/${basePath}/${calendarId}/settings?tab=${CALENDAR_SETTINGS_TABS.STOCK}`}
                >
                  <Pill className="h-4 w-4" />
                  {t('calendar_settings.stock.label')}
                </Link>
              )}
              {calendarType !== 'token' && (
                <Link
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                    activeTab === CALENDAR_SETTINGS_TABS.NOTIFICATIONS ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                  to={`/${lng}/${basePath}/${calendarId}/settings?tab=${CALENDAR_SETTINGS_TABS.NOTIFICATIONS}`}
                >
                  <Bell className="h-4 w-4" />
                  {t('calendar_settings.notifications.label')}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:flex-1">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

export default CalendarSettingsPage;
