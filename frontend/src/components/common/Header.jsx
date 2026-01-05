import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { handleLogout } from '../../services/auth/authService';
import HoveredUserProfile from './HoveredUserProfile';
import NotificationLine from './NotificationLine';
import LanguageSelector from './LanguageSelector.jsx';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Pill,
  Calendar,
  Share2,
  Bell,
  User,
  Settings,
  LogOut,
  UserPlus,
  LogIn,
  Shield,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function buildLocationList(pathWithSlash) {
  return {
    calendar: pathWithSlash.startsWith('/calendar/'),
    sharedUserCalendar: pathWithSlash.startsWith('/shared-user-calendar/'),
    tokenCalendar: pathWithSlash.startsWith('/shared-token-calendar/'),
  };
}

function buildReturnToCalendarList(pathParts) {
  return {
    calendar: pathParts.length === 2 && pathParts[0] === 'calendar',
    sharedUserCalendar:
      pathParts.length === 2 && pathParts[0] === 'shared-user-calendar',
    addCalendar: pathParts.length === 1 && pathParts[0] === 'add-calendar',
  };
}

function buildReturnToCalendar(pathParts) {
  const isDetailPage =
    pathParts.length === 3 &&
    ['medicines', 'boxes', 'pillbox', 'settings', 'stock-alerts', 'daily', 'pillbox-uses', 'ics-tokens'].includes(
      pathParts[2]
    );
  return {
    calendar: pathParts[0] === 'calendar' && isDetailPage,
    sharedUserCalendar:
      pathParts[0] === 'shared-user-calendar' && isDetailPage,
    tokenCalendar: pathParts.length === 3 && pathParts[0] === 'shared-token-calendar',
  };
}

const isPillbox = (pathParts) =>
  pathParts.length === 3 &&
  ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(
    pathParts[0]
  ) &&
  pathParts[2] === 'pillbox';

function Navbar({ sharedProps }) {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { lng } = useParams();
  const { t } = useTranslation();
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [basePath, setBasePath] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  
  const pathAfterLang = location.pathname.split('/').slice(2).join('/');
  const pathWithSlash = '/' + pathAfterLang;
  const pathParts = pathAfterLang.split('/').filter(Boolean);
  const locationList = buildLocationList(pathWithSlash);
  const locationAvailableForReturnToCalendarList = buildReturnToCalendarList(pathParts);
  const shouldShowReturnToCalendarList = Object.values(locationAvailableForReturnToCalendarList).some(Boolean);
  const locationAvailableForReturnToCalendar = buildReturnToCalendar(pathParts);
  const isPillboxPage = isPillbox(pathParts);

  useEffect(() => {
    if (locationList.calendar && sharedProps.personalCalendars.calendarsData) {
      setBasePath('calendar');
      setCalendarInfo(
        sharedProps.personalCalendars.calendarsData.find(
          (calendar) => calendar.id === pathParts[1]
        )
      );
    } else if (
      locationList.sharedUserCalendar &&
      sharedProps.sharedUserCalendars.sharedCalendarsData
    ) {
      setBasePath('shared-user-calendar');
      setCalendarInfo(
        sharedProps.sharedUserCalendars.sharedCalendarsData.find(
          (calendar) => calendar.id === pathParts[1]
        )
      );
    } else if (locationList.tokenCalendar) {
      setBasePath('shared-token-calendar');
      setTokenId(pathParts[1]);
    } else {
      setCalendarInfo(null);
      setBasePath(null);
      setTokenId(null);
    }
  }, [
    location.pathname,
    sharedProps.personalCalendars.calendarsData,
    sharedProps.sharedUserCalendars.sharedCalendarsData,
  ]);

  const { notificationsData, readNotification } = sharedProps.notifications;
  const unreadCount = notificationsData?.filter((n) => !n.read).length || 0;

  return (
    <>
      {/* Desktop Header */}
      <nav className="sticky top-0 z-10 w-full bg-background border-b shadow-sm">
        <div className="w-full px-4">
          <div className="flex h-16 w-full items-center justify-between">
            {/* Logo / Retour */}
            <div className="flex items-center">
              {shouldShowReturnToCalendarList ? (
                <Link to={`/${lng}/calendars`} className="flex items-center gap-2 text-lg font-semibold">
                  <ArrowLeft className="h-5 w-5" /> {t('back')}
                </Link>
              ) : calendarInfo?.id &&
                basePath &&
                (locationAvailableForReturnToCalendar.calendar ||
                  locationAvailableForReturnToCalendar.sharedUserCalendar) ? (
                <Link
                  to={`/${lng}/${basePath}/${calendarInfo.id}`}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" /> {t('back')}
                </Link>
              ) : locationList.tokenCalendar &&
                tokenId &&
                locationAvailableForReturnToCalendar.tokenCalendar ? (
                <Link
                  to={`/${lng}/shared-token-calendar/${tokenId}`}
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" /> {t('back')}
                </Link>
              ) : (
                <Link to={`/${lng}/`} className="flex items-center">
                  <img src="/icons/og-image.png" alt="MediTime" className="h-20" />
                </Link>
              )}
            </div>

            {/* Calendar Title (Desktop) */}
            {((calendarInfo && calendarInfo.id) || (locationList.tokenCalendar && tokenId)) && (
              <div className="hidden lg:flex flex-col items-start">
                <h4 className="text-lg font-semibold">
                  {calendarInfo && basePath && calendarInfo.id && (
                    <Link
                      to={`/${lng}/${basePath}/${calendarInfo.id}`}
                      className="hover:underline"
                    >
                      <span className="text-muted-foreground">{t('calendar.label')} : </span>
                      <span className="font-bold">{calendarInfo.name}</span>
                    </Link>
                  )}
                </h4>
                {locationList.sharedUserCalendar && (
                  <Badge variant="secondary" className="mt-1">
                    {t('shared_by')}{' '}
                    <HoveredUserProfile
                      user={{
                        email: calendarInfo.owner_email,
                        display_name: calendarInfo.owner_name,
                        photo_url: calendarInfo.owner_photo_url,
                      }}
                      trigger={<span>{calendarInfo.owner_name}</span>}
                    />
                  </Badge>
                )}
                {locationList.tokenCalendar && tokenId && (
                  <Link to={`/${lng}/shared-token-calendar/${tokenId}`}>
                    <Badge variant="secondary" className="mt-1">
                      {t('shared_by_token')}
                    </Badge>
                  </Link>
                )}
              </div>
            )}

            {/* Calendar Title (Mobile) */}
            {((calendarInfo && calendarInfo.id) || (locationList.tokenCalendar && tokenId)) && (
              <div className="flex lg:hidden flex-col items-end">
                {calendarInfo && basePath && calendarInfo.id && (
                  <h2 className="font-bold">
                    <Link to={`/${lng}/${basePath}/${calendarInfo.id}`}>
                      {calendarInfo.name}
                    </Link>
                  </h2>
                )}
                {locationList.sharedUserCalendar && (
                  <Badge variant="secondary" className="text-xs">
                    <HoveredUserProfile
                      user={{
                        email: calendarInfo.owner_email,
                        display_name: calendarInfo.owner_name,
                        photo_url: calendarInfo.owner_photo_url,
                      }}
                      trigger={<span>{calendarInfo.owner_name}</span>}
                    />
                  </Badge>
                )}
                {locationList.tokenCalendar && tokenId && (
                  <Link to={`/${lng}/shared-token-calendar/${tokenId}`}>
                    <Badge variant="secondary" className="text-xs">
                      {t('shared_by_token')}
                    </Badge>
                  </Link>
                )}
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">

              {/* Navigation Menu */}
              { userInfo &&
                <NavigationMenu>
                  <NavigationMenuList className="flex flex-row items-center gap-1">
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link to={`/${lng}/calendars`} className="flex flex-row items-center gap-2 px-3 py-2 rounded-md hover:bg-accent whitespace-nowrap">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>{t('calendars')}</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link to={`/${lng}/shared-calendars`} className="flex flex-row items-center gap-2 px-3 py-2 rounded-md hover:bg-accent whitespace-nowrap">
                          <Share2 className="h-4 w-4 shrink-0" />
                          <span>{t('shared')}</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    {userInfo?.role === 'admin' && (
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link to={`/${lng}/admin`} className="flex flex-row items-center gap-2 px-3 py-2 rounded-md hover:bg-accent whitespace-nowrap">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>{t('admin')}</span>
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    )}
                  </NavigationMenuList>
                </NavigationMenu>
              }

              <ThemeToggle />
              <LanguageSelector />

              {/* Notifications Dropdown */}
              {userInfo &&
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (open && sharedProps.notifications.notificationsData && sharedProps.notifications.notificationsData.length > 0 && sharedProps.notifications.notificationsData.some(n => !n.read)) {
                      sharedProps.notifications.readAllNotifications();
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-125">
                    {notificationsData === null ? (
                      <DropdownMenuItem disabled>
                        {t('loading_notifications')}
                      </DropdownMenuItem>
                    ) : notificationsData.filter((n) => !n.read).length === 0 ? (
                      <DropdownMenuItem disabled>
                        {t('no_notifications')}
                      </DropdownMenuItem>
                    ) : (
                      notificationsData
                        .filter((n) => !n.read)
                        .slice(0, 5)
                        .map((notif) => (
                          <NotificationLine
                            key={notif.notification_id}
                            notif={notif}
                            onRead={readNotification}
                          />
                        ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/${lng}/notifications`} className="w-full flex items-center justify-center gap-2">
                        <Bell className="h-4 w-4" /> {t('open_notifications')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    {userInfo ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userInfo.photoUrl} alt={userInfo.displayName} referrerPolicy="no-referrer" />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{userInfo.displayName || t('user')}</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        <span>{t('account.label')}</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userInfo ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={`/${lng}/profile`} className="flex items-center gap-2">
                          <User className="h-4 w-4" /> {t('profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/${lng}/settings`} className="flex items-center gap-2">
                          <Settings className="h-4 w-4" /> {t('settings.label')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600! [&_svg]:text-red-600!">
                        <LogOut className="h-4 w-4" /> {t('logout')}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={`/${lng}/login`} className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" /> {t('login')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/${lng}/register`} className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" /> {t('register')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
      {isPillboxPage && (
        <Link
          to={`/${lng}/${basePath}/${calendarInfo?.id}`}
          className="fixed top-4 right-4 z-40 text-2xl text-foreground"
          aria-label="Fermer"
        >
          <X className="h-8 w-8" />
          <span className="sr-only">{t("close")}</span>
        </Link>
      )}

      {/* Mobile Bottom Navigation moved to Footer */}
    </>
  );
}

Navbar.propTypes = {
  sharedProps: PropTypes.object.isRequired,
};

export default Navbar;
