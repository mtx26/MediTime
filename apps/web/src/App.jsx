// App.js
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './components/common/Header';
import Footer from './components/common/Footer';
import MobileNavBar from './components/common/MobileNavBar';
import AppRoutes from './routes/AppRouter';
import { UserContext } from './contexts/UserContext';
import RealtimeManager from './components/realtime/RealtimeManager';
import { performApiCall } from '@meditime/utils';
import {
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

const API_URL = import.meta.env.VITE_API_URL;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isPillbox = (pathParts) =>
  pathParts.length === 3 &&
  ['calendar', 'shared-user-calendar', 'shared-token-calendar'].includes(
    pathParts[0]
  ) &&
  pathParts[2] === 'pillbox';

function App() {
  const { t, i18n } = useTranslation();
  const { lng } = useParams();
  const location = useLocation();
  const { showAlert } = useAlert();
  
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState(null);

  const pathAfterLang = location.pathname.split('/').slice(2).join('/');
  const pathParts = pathAfterLang.split('/').filter(Boolean);
  const isPillboxPage = isPillbox(pathParts);

  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;

  const [loadingStates, setLoadingStates] = useState({
    calendars: true,
    sharedCalendars: true,
    tokens: true,
    notifications: true,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const isLoading = Object.values(loadingStates).some((v) => v);
    setIsInitialLoading(isLoading);
  }, [loadingStates]);

  const userApi = useMemo(() => {
    return createUserApi({ apiUrl: API_URL, uid, showAlert, performApiCall });
  }, [uid, showAlert]);

  const personalCalendarsApi = useMemo(() => {
    return createPersonalCalendarsApi({
      apiUrl: API_URL,
      uid,
      showAlert,
      performApiCall,
    });
  }, [uid, showAlert]);

  const sharedUserCalendarsApi = useMemo(() => {
    return createSharedUserCalendarsApi({
      apiUrl: API_URL,
      uid,
      showAlert,
      performApiCall,
    });
  }, [uid, showAlert]);

  const tokenCalendarsApi = useMemo(() => {
    return createTokenCalendarsApi({
      apiUrl: API_URL,
      uid,
      showAlert,
      performApiCall,
    });
  }, [uid, showAlert]);

  const notificationsApi = useMemo(() => {
    return createNotificationsApi({ apiUrl: API_URL, uid, showAlert, performApiCall });
  }, [uid, showAlert]);

  const documentsApi = useMemo(() => {
    return createDocumentsApi({
      apiUrl: API_URL,
      uid,
      showAlert,
      performApiCall,
      fileToBase64,
    });
  }, [uid, showAlert]);

  const downloadPersonalCalendarPdf = useCallback(async (calendarId, includeInactive) => {
    const url = personalCalendarsApi.getPersonalCalendarPdfUrl(calendarId, includeInactive);
    window.open(url, '_blank');
  }, [personalCalendarsApi]);

  // 🔐 Demande de permission et envoi du token
  const sendTokenToBackend = useCallback(async (maxRetries = 4) => {
    if (!uid) return;
    const token = await requestPermissionAndGetToken(uid);
    if (!token) {
      if (maxRetries > 0) {
        return await sendTokenToBackend(maxRetries - 1);
      } else {
        // Ne pas envoyer de requête si le token est toujours absent
        return;
      }
    }

    // Récupérer les informations de l'appareil
    const deviceName = navigator.userAgent
    // recupere juste le Mozilla/5.0 (<system-information>) part
    .match(/Mozilla\/5\.0 \(([^)]+)\)/)?.[1] || 'Unknown Device';
    console.log('FCM Token obtenu :', token, 'Device Name :', deviceName);

    // N'envoyer la requête que si le token est bien défini
    return await performApiCall({
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
  }, [showAlert]);
  

  const sharedProps = {
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
      isInitialLoading,
    },
    user: {
      ...userApi,
    },
  };

  const resetAppData = () => {
    // CALENDARS
    setCalendarsData(null);

    // TOKENS
    setTokensList([]);

    // NOTIFICATIONS
    setNotificationsData(null);

    // SHARED CALENDARS
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
        .catch((err) => {
          console.error(t('fcm.sw_error'), {
            origin: 'FCM_SW_REGISTER',
            code: 'FCM_SW_REGISTER_ERROR',
            error: err,
          });
        });
    }
  }, [userInfo?.uid]);

  useEffect(() => {
    const fcmNotificationsEnabled = window?.Notification?.permission === 'granted' || false;
    if (fcmNotificationsEnabled) {
      setTimeout(() => {
        sendTokenToBackend();
      }, 1000);
    }
  }, [window?.Notification?.permission, sendTokenToBackend]);

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
    document.documentElement.setAttribute('lang', lng);
  }, [lng, i18n]);

  const path = location.pathname.startsWith(`/${lng}`)
    ? location.pathname.slice(lng.length + 1) || '/home'
    : location.pathname;

  // Hook SEO unifié
  useSEO({ path });

  return (
    <div className="flex flex-col min-h-screen">
      <OnboardingTour isAppLoading={isInitialLoading} />
      <Navbar sharedProps={sharedProps}/>
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
      {location.pathname !== `/${lng}/login` && location.pathname !== `/${lng}/register` && !isPillboxPage &&
        <div className='mt-24 lg:mt-0'>
          <MobileNavBar/>
        </div>
      }
    </div>
  );
}

export default App;
