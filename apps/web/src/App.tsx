import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  type ReactElement,
} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './components/common/Header';
import Footer from './components/common/Footer';
import MobileNavBar from './components/common/MobileNavBar';
import AppRoutes from './routes/AppRouter';
import { TooltipProvider } from './components/ui/tooltip';
import { UserContext } from './contexts/UserContext';
import RealtimeManager from './components/realtime/RealtimeManager';
import {
  performApiCall,
  createDocumentsApi,
  createNotificationsApi,
  createPersonalCalendarsApi,
  createSharedUserCalendarsApi,
  createTokenCalendarsApi,
  createUserApi,
} from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import useSEO from './hooks/useSEO';
import OnboardingTour from './components/onboarding/OnboardingTour';
import { requestPermissionAndGetToken } from './services/firebase/firebase';
import { useAlert } from './contexts/AlertContext';
import type { ApiResult, AppSharedProps, CalendarInfo, LoadingStates, NotificationItem, SharedTokenItem } from '@meditime/types';

const API_URL = import.meta.env.VITE_API_URL;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      resolve(value.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isPillbox = (pathParts: string[]): boolean =>
  pathParts.length === 3 &&
  ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(pathParts[0] || '') &&
  pathParts[2] === 'pillbox';

export default function App(): ReactElement {
  const { t, i18n } = useTranslation();
  const { lng } = useParams();
  const location = useLocation();
  const { showAlert } = useAlert();

  const [tokensList, setTokensList] = useState<SharedTokenItem[]>([]);
  const [calendarsData, setCalendarsData] = useState<CalendarInfo[] | null>(null);
  const [notificationsData, setNotificationsData] = useState<NotificationItem[] | null>(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState<CalendarInfo[] | null>(null);

  const pathAfterLang = location.pathname.split('/').slice(2).join('/');
  const pathParts = pathAfterLang.split('/').filter(Boolean);
  const isPillboxPage = isPillbox(pathParts);

  const userContext = useContext(UserContext) as { userInfo?: { uid?: string } | null } | null;
  const userInfo = userContext?.userInfo;
  const uid = userInfo?.uid ?? null;

  const apiFactoryOptions = useMemo(() => {
    return {
      apiUrl: API_URL,
      uid,
      showAlert,
      performApiCall,
    };
  }, [uid, showAlert]);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    calendars: true,
    sharedCalendars: true,
    tokens: true,
    notifications: true,
    isInitialLoading: true,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const isLoading = Object.entries(loadingStates)
      .filter(([key]) => key !== 'isInitialLoading')
      .some(([, v]) => v);
    setIsInitialLoading(isLoading);
  }, [loadingStates]);

  const userApi = useMemo(() => createUserApi(apiFactoryOptions), [apiFactoryOptions]);
  const personalCalendarsApi = useMemo(() => createPersonalCalendarsApi(apiFactoryOptions), [apiFactoryOptions]);
  const sharedUserCalendarsApi = useMemo(() => createSharedUserCalendarsApi(apiFactoryOptions), [apiFactoryOptions]);
  const tokenCalendarsApi = useMemo(() => createTokenCalendarsApi(apiFactoryOptions), [apiFactoryOptions]);
  const notificationsApi = useMemo(() => createNotificationsApi(apiFactoryOptions), [apiFactoryOptions]);

  const documentsApi = useMemo(() => {
    return createDocumentsApi({
      ...apiFactoryOptions,
      fileToBase64,
    });
  }, [apiFactoryOptions]);

  const downloadPersonalCalendarPdf = useCallback(async (calendarId: string, includeInactive: boolean) => {
    const url = personalCalendarsApi.getPersonalCalendarPdfUrl(calendarId, includeInactive);
    window.open(url, '_blank');
  }, [personalCalendarsApi]);

  const sendTokenToBackend = useCallback(async (maxRetries = 4): Promise<ApiResult | null> => {
    if (!uid) return null;
    const token = await requestPermissionAndGetToken(uid);
    if (!token) {
      if (maxRetries > 0) {
        return sendTokenToBackend(maxRetries - 1);
      }
      return null;
    }

    const deviceName =
      navigator.userAgent.match(/Mozilla\/5\.0 \(([^)]+)\)/)?.[1] || 'Unknown Device';

    return performApiCall({
      url: `${API_URL}/api/notifications/fcm-token`,
      method: 'POST',
      body: {
        token,
        deviceName,
      },
      origin: 'FCM_TOKEN_SEND',
      uid,
      analyticsEvent: 'FCM_TOKEN_SEND',
      analyticsData: { uid, token },
      showAlert,
    });
  }, [uid, showAlert]);

  const sharedProps: AppSharedProps = {
    personalCalendars: {
      ...personalCalendarsApi,
      ...documentsApi,
      calendarsData,
      setCalendarsData,
      downloadPersonalCalendarPdf,
    },
    sharedUserCalendars: {
      ...sharedUserCalendarsApi,
      sharedCalendarsData,
      setSharedCalendarsData,
    },
    tokenCalendars: {
      ...tokenCalendarsApi,
      tokensList,
      setTokensList,
    },
    notifications: {
      ...notificationsApi,
      notificationsData,
      setNotificationsData,
    },
    fcm: {
      sendTokenToBackend,
    },
    loadingStates: {
      ...loadingStates,
      isInitialLoading,
    },
    user: {
      ...userApi,
    },
  };

  const resetAppData = (): void => {
    setCalendarsData(null);
    setTokensList([]);
    setNotificationsData(null);
    setSharedCalendarsData(null);
  };

  useEffect(() => {
    resetAppData();
    setLoadingStates((current) => ({
      ...current,
      calendars: false,
      sharedCalendars: false,
      notifications: false,
      tokens: false,
    }));
  }, [userInfo?.uid]);

  useEffect(() => {
    if (!userInfo?.uid) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log(t('fcm.sw_registered'), {
            origin: 'FCM_SW_REGISTER',
            code: 'FCM_SW_REGISTER_SUCCESS',
            registration,
          });
        })
        .catch((err: unknown) => {
          console.error(t('fcm.sw_error'), {
            origin: 'FCM_SW_REGISTER',
            code: 'FCM_SW_REGISTER_ERROR',
            error: err,
          });
        });
    }
  }, [userInfo?.uid, t]);

  useEffect(() => {
    const fcmNotificationsEnabled = window.Notification?.permission === 'granted' || false;
    if (fcmNotificationsEnabled) {
      const timer = setTimeout(() => {
        void sendTokenToBackend();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [sendTokenToBackend]);

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
    if (lng) {
      document.documentElement.setAttribute('lang', lng);
    }
  }, [lng, i18n]);

  const path = location.pathname.startsWith(`/${lng}`)
    ? location.pathname.slice((lng?.length || 0) + 1) || '/home'
    : location.pathname;
  const isAuthRoute = location.pathname === `/${lng}/login` || location.pathname === `/${lng}/register`;

  useSEO({ path });

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <OnboardingTour isAppLoading={isInitialLoading} />
        <Navbar sharedProps={sharedProps} />
        <main className="flex flex-col min-h-0 grow">
          {userInfo && (
            <RealtimeManager
              setCalendarsData={setCalendarsData}
              setSharedCalendarsData={setSharedCalendarsData}
              setNotificationsData={setNotificationsData}
              setTokensList={setTokensList}
              setLoadingStates={setLoadingStates}
              calendarsData={calendarsData}
              sharedCalendarsData={sharedCalendarsData}
            />
          )}

          <div className="container mx-auto px-4 my-4">
            <AppRoutes sharedProps={sharedProps} />
          </div>
        </main>
        <Footer />
        {!isAuthRoute && !isPillboxPage && (
          <div className="mt-24 lg:mt-0">
            <MobileNavBar />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
