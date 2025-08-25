// App.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './components/common/Header';
import Footer from './components/common/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { UserContext } from './contexts/UserContext';
import { formatToLocalISODate } from './utils/calendar/dateUtils';
import RealtimeManager from './components/realtime/RealtimeManager';
import { getToken } from './services/supabase/tokenUtils';
import { performApiCall } from './services/api/apiUtils';
import { useTranslation } from 'react-i18next';
import I18nHead from './components/common/I18nHead';
import StructuredData from './components/common/StructuredData';

const API_URL = import.meta.env.VITE_API_URL;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function App() {
  const { t, i18n } = useTranslation();
  const { lng } = useParams();
  const location = useLocation();
  
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState(null);

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

  // Fonction pour ajouter un calendrier
  const addCalendar = useCallback(async (calendarName) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars`,
      method: 'POST',
      body: { calendarName },
      origin: 'CALENDAR_CREATE',
      uid,
      analyticsEvent: 'add_calendar',
      analyticsData: { calendarName, uid },
    });
  }, []);

  // Fonction pour supprimer un calendrier
  const deleteCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}`,
      method: 'DELETE',
      origin: 'CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_calendar',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour renommer un calendrier
  const renameCalendar = useCallback(async (calendarId, newCalendarName) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}`,
      method: 'PUT',
      body: { newCalendarName },
      origin: 'CALENDAR_RENAME',
      uid,
      analyticsEvent: 'rename_calendar',
      analyticsData: {
        calendarId,
        newCalendarName,
        uid,
      },
    });
  }, []);


  // Fonction pour obtenir le calendrier lier au calendarId
  const fetchPersonalCalendarSchedule = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());

    const result = await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/schedule?startDate=${start}`,
      method: 'GET',
      origin: 'CALENDAR_FETCH_SCHEDULE',
      uid,
      analyticsEvent: 'fetch_personal_calendar_schedule',
      analyticsData: {
        calendarId,
        uid,
        startDate: start,
      },
    });

    if (result.success) {
      return {
        success: true,
        message: result.message,
        code: result.code,
        schedule: result.schedule ?? [],
        calendarName: result.calendar_name ?? '',
        table: result.table ?? {},
        ifLowStock: result.if_low_stock ?? false,
      };
    } else {
      return {
        success: false,
        error: result.error,
        code: result.code,
        schedule: [],
        calendarName: '',
        table: {},
      };
    }
  }, []);


  // Fonction pour modifier la boîte d'un calendrier personnel
  const updatePersonalBox = useCallback(async (calendarId, boxId, box) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
      method: 'PUT',
      body: { box },
      origin: 'BOX_UPDATE',
      uid,
      analyticsEvent: 'update_personal_box',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour créer une boîte de médicaments
  const createPersonalBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0, dose = 0 ) => {
    const result = await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes`,
      method: 'POST',
      body: { 
        box: {
          name,
          dose,
          box_capacity: boxCapacity,
          stock_alert_threshold: stockAlertThreshold,
          stock_quantity: stockQuantity,
        }
      },
      origin: 'BOX_CREATE',
      uid,
      analyticsEvent: 'create_personal_box',
      analyticsData: { calendarId, uid },
    });

    if (result.success) {
      return {
        success: true,
        boxId: result.box_id,
        message: result.message,
        code: result.code,
      };
    } else {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }
  }, []);
  

  // Fonction pour supprimer une boîte
  const deletePersonalBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'BOX_DELETE',
      uid,
      analyticsEvent: 'delete_personal_box',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // fonction pour diminuer le stock du pillulier
  const useMedicinesForPersonalPillbox   = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/pilluliers/used`,
      method: 'POST',
      body: { startDate: start },
      origin: 'USE_PILLULIER',
      uid,
      analyticsEvent: 'use_pillulier_medication',
      analyticsData: { calendarId, uid, startDate: start },
    });
  }, []);

  const fetchPersonalStockDecrementMethod = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/stock-decrement-method`,
      method: 'GET',
      origin: 'STOCK_DECREMENT_METHOD_FETCH',
      uid,
      analyticsEvent: 'fetch_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, []);
  
  
  const updatePersonalStockDecrementMethod = useCallback(async (calendarId, method) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/stock-decrement-method`,
      method: 'POST',
      body: { method },
      origin: 'STOCK_DECREMENT_METHOD_UPDATE',
      uid,
      analyticsEvent: 'update_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, []);


  const personalRestockBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}/restock`,
      method: 'POST',
      origin: 'BOX_RESTOCK',
      uid,
      analyticsEvent: 'restock_personal_box',
      analyticsData: { calendarId, boxId, uid },
    });
  }, []);

  const fetchPersonalNotificationsEnabled = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/notifications`,
      method: 'GET',
      origin: 'NOTIFICATIONS_ENABLED_FETCH',
      uid,
      analyticsEvent: 'fetch_personal_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(async (token, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());

    const result = await performApiCall({
      url: `${API_URL}/api/tokens/${token}/schedule?startDate=${start}`,
      method: 'GET',
      origin: 'TOKEN_FETCH_SCHEDULE',
      analyticsEvent: 'fetch_token_calendar_schedule',
      analyticsData: {
        token,
        startTime: start,
      },
    });

    return {
      success: result.success,
      message: result.message,
      code: result.code,
      schedule: result.schedule ?? [],
      calendarName: result.calendar_name ?? '',
      table: result.table ?? {},
      error: result.error,
    };
  }, []);
  

  // Fonction pour créer un lien de partage
  const createToken = useCallback(async (calendarId, expiresAt, permissions) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/${calendarId}`,
      method: 'POST',
      body: { expiresAt, permissions },
      origin: 'TOKEN_CREATE',
      analyticsEvent: 'create_token',
      analyticsData: { calendarId },
    });
  }, []);
  

  // Fonction pour supprimer un lien de partage
  const deleteToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/${token}`,
      method: 'DELETE',
      origin: 'TOKEN_DELETE',
      uid,
      analyticsEvent: 'delete_token',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour revoker un token
  const updateRevokeToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/revoke/${token}`,
      method: 'POST',
      origin: 'TOKEN_REVOKE',
      uid,
      analyticsEvent: 'update_revoke_token',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = useCallback(async (token, expiresAt) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/expiration/${token}`,
      method: 'POST',
      body: { expiresAt },
      origin: 'TOKEN_EXPIRATION_UPDATE',
      uid,
      analyticsEvent: 'update_token_expiration',
      analyticsData: { token, uid, expiresAt },
    });
  }, []);
  

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = useCallback(async (token, permissions) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/permissions/${token}`,
      method: 'POST',
      body: { permissions },
      origin: 'TOKEN_PERMISSIONS_UPDATE',
      uid,
      analyticsEvent: 'update_token_permissions',
      analyticsData: { token, uid, permissions },
    });
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = useCallback(async (email, calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/${calendarId}`,
      method: 'POST',
      body: { email },
      origin: 'INVITATION_SEND',
      uid,
      analyticsEvent: 'send_invitation',
      analyticsData: { email, calendarId, uid },
    });
  }, []);

  /// login

  // Fonction pour récupérer une invitation
  const getLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/${token}`,
      method: 'GET',
      origin: 'GET_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'get_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  // Fonction pour supprimer un utilisateur partagé pour le owner
  const deleteLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/${token}`,
      method: 'DELETE',
      origin: 'DELETE_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'delete_shared_user',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour accepter une invitation
  const acceptLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/accept/${token}`,
      method: 'POST',
      origin: 'ACCEPT_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'accept_invitation',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour rejeter une invitation
  const rejectLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/reject/${token}`,
      method: 'POST',
      origin: 'REJECT_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'reject_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  /// Registration

  const getRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/${token}`,
      method: 'GET',
      origin: 'GET_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'get_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  const deleteRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/${token}`,
      method: 'DELETE',
      origin: 'DELETE_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'delete_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  const acceptRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/accept/${token}`,
      method: 'POST',
      origin: 'ACCEPT_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'accept_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  const rejectRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/reject/${token}`,
      method: 'POST',
      origin: 'REJECT_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'reject_invitation',
      analyticsData: { token, uid },
    });
  }, []);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  

  // Fonction pour marquer une notification comme lue
  const readNotification = useCallback(async (notificationId) => {
    return await performApiCall({
      url: `${API_URL}/api/notifications/${notificationId}`,
      method: 'POST',
      origin: 'NOTIFICATION_READ',
      uid,
      analyticsEvent: 'read_notification',
      analyticsData: { notificationId, uid },
    });
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour supprimer un calendrier partagé pour le receiver
  const deleteSharedCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}`,
      method: 'DELETE',
      origin: 'SHARED_CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_shared_calendar',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour récupérer les différentes utilisateurs ayant accès à un calendrier
  const fetchGroupedSharedCalendars = useCallback(async () => {
    return await performApiCall({
      url: `${API_URL}/api/shared/grouped`,
      method: 'GET',
      origin: 'SHARED_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_users',
      analyticsData: { uid },
    });
  }, []);
  

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour recup le calendrier partagé par un utilisateur
  const fetchSharedUserCalendarSchedule = useCallback(
    async (calendarId, startDate = null) => {
      const start = startDate || formatToLocalISODate(new Date());
  
      const response = await performApiCall({
        url: `${API_URL}/api/shared/users/calendars/${calendarId}/schedule?startDate=${start}`,
        method: 'GET',
        origin: 'SHARED_CALENDAR_FETCH_SCHEDULE',
        uid,
        analyticsEvent: 'fetch_shared_user_calendar_schedule',
        analyticsData: { calendarId, uid, startDate: start },
      });
  
      if (response.success) {
        return {
          ...response,
          schedule: response.schedule,
          calendarName: response.calendar_name,
          table: response.table,
          ifLowStock: response.if_low_stock ?? false,
        };
      }
  
      return {
        ...response,
        schedule: [],
        calendarName: '',
        table: {},
      };
    },
    []
  );
  

  // Fonction pour mettre à jour une boite de médicaments d'un calendrier partagé
  const updateSharedUserBox = useCallback(async (calendarId, boxId, box) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
      method: 'PUT',
      body: { box },
      origin: 'BOX_UPDATE',
      uid,
      analyticsEvent: 'update_shared_user_box',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour créer une boite de médicaments
  const createSharedUserBox = useCallback(
    async (
      calendarId,
      name,
      boxCapacity = 0,
      stockAlertThreshold = 10,
      stockQuantity = 0,
      dose = 0
    ) => {
      const result = await performApiCall({
        url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes`,
        method: 'POST',
        body: {
          box: {
            name,
            dose,
            box_capacity: boxCapacity,
            stock_alert_threshold: stockAlertThreshold,
            stock_quantity: stockQuantity,
          },
        },
        origin: 'BOX_CREATE',
        uid,
        analyticsEvent: 'create_shared_user_box',
        analyticsData: { calendarId, uid },
      });
  
      if (result.success) {
        return {
          ...result,
          boxId: result?.data?.box_id ?? null,
        };
      }
  
      return result;
    },
    []
  );
  

  // Fonction pour supprimer une boîte
  const deleteSharedUserBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'BOX_DELETE',
      uid,
      analyticsEvent: 'delete_shared_user_box',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour diminuer le stock du pillulier
  const useMedicinesForSharedUserPillbox = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/pilluliers/used`,
      method: 'POST',
      body: { startDate: start },
      origin: 'USE_PILLULIER',
      uid,
      analyticsEvent: 'use_shared_user_pillulier_medication',
      analyticsData: { calendarId, startDate: start },
    });
  }, []);

  const sharedUserRestockBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}/restock`,
      method: 'POST',
      origin: 'BOX_RESTOCK',
      uid,
      analyticsEvent: 'restock_shared_user_box',
      analyticsData: { calendarId, boxId, uid },
    });
  }, []);

  const fetchSharedUserNotificationsEnabled = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/notifications`,
      method: 'GET',
      origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_user_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const updateSharedUserNotificationsEnabled = useCallback(async (calendarId, enabled) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/notifications`,
      method: 'PUT',
      body: { "notifications-enabled": enabled },
      origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_UPDATE',
      uid,
      analyticsEvent: 'update_shared_user_notifications_enabled',
      analyticsData: { calendarId, uid, enabled },
    });
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const analyzeImage = useCallback(async (file) => {
      const base64 = await fileToBase64(file);

      return await performApiCall({
        url: `${API_URL}/api/documents/analyze`,
        method: 'POST',
        body: { image: base64 },
        origin: 'DOCUMENT_ANALYZE',
        uid,
        analyticsEvent: 'DOCUMENT_ANALYZE',
        analyticsData: { uid },
      });
    }, []);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const downloadPersonalCalendarPdf = useCallback(async (calendarId) => {
    const url = `${API_URL}/api/calendars/${calendarId}/pdf`;
    window.open(url, '_blank');
  }, []);
  
  

  const sharedProps = {
    personalCalendars: {
      fetchPersonalCalendarSchedule,
      addCalendar,
      renameCalendar,
      deleteCalendar,
      calendarsData,
      setCalendarsData,
      updatePersonalBox,
      createPersonalBox,
      deletePersonalBox,
      downloadPersonalCalendarPdf,
      useMedicinesForPersonalPillbox,
      fetchPersonalStockDecrementMethod,
      updatePersonalStockDecrementMethod,
      personalRestockBox,
      fetchPersonalNotificationsEnabled,
      analyzeImage,
    },

    sharedUserCalendars: {
      fetchSharedUserCalendarSchedule,
      fetchGroupedSharedCalendars,
      sendInvitation,
      getLoginInvitation,
      acceptLoginInvitation,
      rejectLoginInvitation,
      deleteLoginInvitation,
      getRegistrationInvitation,
      acceptRegistrationInvitation,
      rejectRegistrationInvitation,
      deleteRegistrationInvitation,
      deleteSharedCalendar,
      sharedCalendarsData,
      setSharedCalendarsData,
      updateSharedUserBox,
      createSharedUserBox,
      deleteSharedUserBox,
      useMedicinesForSharedUserPillbox,
      sharedUserRestockBox,
      fetchSharedUserNotificationsEnabled,
      updateSharedUserNotificationsEnabled,
    },

    tokenCalendars: {
      fetchTokenCalendarSchedule,
      createToken,
      updateTokenPermissions,
      updateTokenExpiration,
      updateRevokeToken,
      deleteToken,
      tokensList,
      setTokensList,
    },

    notifications: {
      readNotification,
      notificationsData,
      setNotificationsData,
    },

    loadingStates: {
      isInitialLoading,
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
          log.info(t('fcm.sw_registered'), registration, {
            origin: 'FCM_SW_REGISTER_SUCCESS',
          });
        })
        .catch((err) => {
          log.error(t('fcm.sw_error'), err, {
            origin: 'FCM_SW_REGISTER_ERROR',
          });
        });
    }

    // 🔐 Demande de permission et envoi du token
    const sendTokenToBackend = async () => {
      const { requestPermissionAndGetToken } = await import('./services/firebase/firebase');
      const tokenFcm = await requestPermissionAndGetToken(userInfo?.uid);
      const token = await getToken();
      if (!token || !userInfo?.uid) return;

      // 🎯 Envoi du token FCM au backend Flask
      fetch(`${API_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: tokenFcm,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          log.info(t('fcm.token_registered'), {
            uid: userInfo.uid,
            token: tokenFcm,
            origin: 'FCM_TOKEN',
            code: 'FCM_TOKEN_REGISTER_SUCCESS',
          });
        })
        .catch((error) => {
          log.error(t('fcm.token_send_error'), {
            uid: userInfo.uid,
            token: tokenFcm,
            origin: 'FCM_TOKEN',
            code: 'FCM_TOKEN_REGISTER_ERROR',
            error: error,
          });
        });
    };

    sendTokenToBackend();
  }, [userInfo?.uid]);

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
    document.documentElement.setAttribute('lang', lng);
  }, [lng, i18n]);

  const path = location.pathname.startsWith(`/${lng}`)
    ? location.pathname.slice(lng.length + 1) || '/home'
    : location.pathname;

  return (
    <div className="d-flex flex-column min-vh-100">
      <I18nHead 
        title={t('home_meta.title')} 
        description={t('home_meta.description')} 
        path={path} 
      />
      <StructuredData />
      <Navbar sharedProps={sharedProps} />
      <main className="flex-grow-1 d-flex flex-column pb-5 pb-lg-0">
        {userInfo && (
          <RealtimeManager
            setCalendarsData={setCalendarsData}
            setSharedCalendarsData={setSharedCalendarsData}
            setNotificationsData={setNotificationsData}
            setTokensList={setTokensList}
            setLoadingStates={setLoadingStates}
          />
        )}

        <div className="container mt-4 pb-5 pb-lg-0">
          <AppRoutes sharedProps={sharedProps} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
