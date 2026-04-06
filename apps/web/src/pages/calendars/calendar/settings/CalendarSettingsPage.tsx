import { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Stock from './CalendarStock';
import Notifications from './CalendarNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotFound from '@/pages/general/NotFound';
import type { CalendarSettingsPageProps } from '@meditime/types';
// import Sharing from './calendar-settings/Sharing';

function CalendarSettingsPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: CalendarSettingsPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { lng } = params;

  const [notFound, setNotFound] = useState(false);

  const sharedProps = {
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  };

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab) return tab;

    // Valeur par défaut selon le type de calendrier
    switch (calendarType) {
      case 'personal':
        return 'stock';
      case 'sharedUser':
        return 'notifications';
      default:
        return null;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  const renderTab = () => {
    switch (activeTab) {
      case 'stock':
        if (calendarType === 'personal') {
          return <Stock {...sharedProps} setNotFound={setNotFound}/>;
        }
        break;
      case 'notifications':
        if (calendarType !== 'token') {
          return <Notifications {...sharedProps} setNotFound={setNotFound}/>;
        }
        break;
      // case 'sharing':
      //   return <Sharing {...sharedProps} />;
      default:
        if (calendarType === 'personal') {
          return <Stock {...sharedProps} setNotFound={setNotFound} />;
        } else if (calendarType === 'sharedUser') {
          return <Notifications {...sharedProps} setNotFound={setNotFound} />;
        }
        return null;
    }
  };

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-1/4 mb-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Settings className="inline-block mr-2 mb-1" />
                {t('calendar_settings.label')
                }</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1">

              {calendarType === 'personal' && (
                <Link
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                    activeTab === 'stock' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  )}
                  to={`/${lng}/${basePath}/${calendarId}/settings?tab=stock`}
                >
                  <Pill className="h-4 w-4" />
                  {t('calendar_settings.stock.label')}
                </Link>
              )}

              {calendarType !== 'token' && (
                <Link
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                    activeTab === 'notifications' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  )}
                  to={`/${lng}/${basePath}/${calendarId}/settings?tab=notifications`}
                >
                  <Bell className="h-4 w-4" />
                  {t('calendar_settings.notifications.label')}
                </Link>
              )}

              {/* 
              <Link
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  activeTab === 'sharing' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                )}
                to={`/${lng}/${basePath}/${calendarId}/settings?tab=sharing`}
              >
                <Share className="h-4 w-4" />
                {t('calendar_settings.sharing.label')}
              </Link>
              */}
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
