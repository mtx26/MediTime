// App.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from './components/common/Header';
import Footer from './components/common/Footer';
import AppRoutes from './routes/AppRouter';
import { UserContext } from './contexts/UserContext';
import { toISO } from './utils/calendar/dateUtils';
import RealtimeManager from './components/realtime/RealtimeManager';
import { performApiCall } from './services/api/apiUtils';
import { useTranslation } from 'react-i18next';
import useSEO from './hooks/useSEO';
import OnboardingTour from './components/onboarding/OnboardingTour';
import { requestPermissionAndGetToken } from './services/firebase/firebase';

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
    const start = startDate || toISO(new Date());

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
  const createPersonalBox = useCallback(async (calendarId, name, boxCapacity, stockAlertThreshold, stockQuantity, dose ) => {
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

  // Fonction pour récupérer si le pillbox d'un calendrier a été utilisé
  const fetchIfPersonalPillboxUsed = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || toISO(new Date());
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/pillbox/used?startDate=${start}`,
      method: 'GET',
      origin: 'GET_PILLBOX_USED',
      uid,
      analyticsEvent: 'fetch_if_pillbox_used',
      analyticsData: { calendarId, uid, startDate: start },
    });
  }, []);

  // fonction pour diminuer le stock du pillulier
  const useMedicinesForPersonalPillbox   = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || toISO(new Date());
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/pillbox/used`,
      method: 'POST',
      body: { startDate: start },
      origin: 'USE_PILLBOX',
      uid,
      analyticsEvent: 'use_pillbox_medication',
      analyticsData: { calendarId, uid, startDate: start },
    });
  }, []);

  // Fonction pour annuler l'utilisation du pillbox d'un calendrier
  const cancelUsePersonalPillbox = useCallback(async (calendarId, useId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/pillbox/uses/${useId}`,
      method: 'DELETE',
      origin: 'CANCEL_PILLBOX_USE',
      uid,
      analyticsEvent: 'cancel_use_personal_pillbox',
      analyticsData: { calendarId, useId, uid },
    });
  }, []);

  // Fonction pour recuperer la list des utilisations du pillbox
  const fetchPersonalPillboxUses = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/pillbox/uses`,
      method: 'GET',
      origin: 'GET_PILLBOX_USES',
      uid,
      analyticsEvent: 'fetch_personal_pillbox_uses',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour récupérer la méthode de décrément de stock
  const fetchPersonalStockDecrementMethod = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/stock-decrement-method`,
      method: 'GET',
      origin: 'PERSONNAL_STOCK_DECREMENT_METHOD_FETCH',
      uid,
      analyticsEvent: 'fetch_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour mettre à jour la méthode de décrément de stock
  const updatePersonalStockDecrementMethod = useCallback(async (calendarId, method) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/stock-decrement-method`,
      method: 'POST',
      body: { method },
      origin: 'PERSONNAL_STOCK_DECREMENT_METHOD_UPDATE',
      uid,
      analyticsEvent: 'update_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour restocker une boîte
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
      origin: 'PERSONAL_NOTIFICATIONS_ENABLED_FETCH',
      uid,
      analyticsEvent: 'fetch_personal_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const updatePersonalNotificationsEnabled = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/notifications`,
      method: 'PUT',
      origin: 'PERSONAL_NOTIFICATIONS_ENABLED_UPDATE',
      uid,
      analyticsEvent: 'update_personal_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, []);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  const getTokensIcs = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/ics`,
      method: 'GET',
      origin: 'GET_ICS_TOKENS',
      uid,
      analyticsEvent: 'get_ics_tokens',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const createTokenIcs = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/ics`,
      method: 'POST',
      origin: 'CREATE_ICS_TOKEN',
      uid,
      analyticsEvent: 'create_ics_token',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const deleteTokenIcs = useCallback(async (calendarId, tokenId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/ics/${tokenId}`,
      method: 'DELETE',
      origin: 'DELETE_ICS_TOKEN',
      uid,
      analyticsEvent: 'delete_ics_token',
      analyticsData: { calendarId, tokenId, uid },
    });
  }, []);

  const getSharedTokensIcs = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/ics`,
      method: 'GET',
      origin: 'LIST_SHARED_ICS_TOKENS',
      uid,
      analyticsEvent: 'get_shared_ics_tokens',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const createSharedTokenIcs = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/ics`,
      method: 'POST',
      origin: 'CREATE_SHARED_ICS_TOKEN',
      uid,
      analyticsEvent: 'create_shared_ics_token',
      analyticsData: { calendarId, uid },
    });
  }, []);

  const deleteSharedTokenIcs = useCallback(async (calendarId, tokenId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/ics/${tokenId}`,
      method: 'DELETE',
      origin: 'DELETE_SHARED_ICS_TOKEN',
      uid,
      analyticsEvent: 'delete_shared_ics_token',
      analyticsData: { calendarId, tokenId, uid },
    });
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(async (token, startDate = null) => {
    const start = startDate || toISO(new Date());

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
      const start = startDate || toISO(new Date());
  
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
      boxCapacity,
      stockAlertThreshold,
      stockQuantity,
      dose
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

  // Fonction pour récupérer si le pillbox d'un calendrier partagé a été utilisé
  const fetchIfSharedUserPillboxUsed = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || toISO(new Date());
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/pillbox/used?startDate=${start}`,
      method: 'GET',
      origin: 'GET_PILLBOX_USED',
      uid,
      analyticsEvent: 'fetch_if_shared_user_pillbox_used',
      analyticsData: { calendarId, uid, startDate: start },
    });
  }, []);

  // Fonction pour diminuer le stock du pillulier
  const useMedicinesForSharedUserPillbox = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || toISO(new Date());
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/pillbox/used`,
      method: 'POST',
      body: { startDate: start },
      origin: 'USE_PILLBOX',
      uid,
      analyticsEvent: 'use_shared_user_pillbox_medication',
      analyticsData: { calendarId, startDate: start },
    });
  }, []);

  // Fonction pour annuler l'utilisation du pillbox d'un calendrier partagé
  const cancelUseSharedUserPillbox = useCallback(async (calendarId, useId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/pillbox/uses/${useId}`,
      method: 'DELETE',
      origin: 'CANCEL_PILLBOX_USE',
      uid,
      analyticsEvent: 'cancel_use_shared_user_pillbox',
      analyticsData: { calendarId, useId, uid },
    });
  }, []);

  // Fonction pour récupérer la liste des utilisations du pillbox
  const fetchSharedUserPillboxUses = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/pillbox/uses`,
      method: 'GET',
      origin: 'GET_PILLBOX_USES',
      uid,
      analyticsEvent: 'fetch_shared_user_pillbox_uses',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour restocker une boîte
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

  // Fonction pour récupérer les notifications activées
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

  // Fonction pour mettre à jour les notifications activées
  const updateSharedUserNotificationsEnabled = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/notifications`,
      method: 'PUT',
      origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_UPDATE',
      uid,
      analyticsEvent: 'update_shared_user_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, []);

  // Fonction pour récupérer la méthode de décrément de stock
  const fetchSharedUserStockDecrementMethod = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/stock-decrement-method`,
      method: 'GET',
      origin: 'SHARED_USER_STOCK_DECREMENT_METHOD_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_user_stock_decrement_method',
      analyticsData: { calendarId, uid },
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

    const saveAnalysisResult = useCallback(async (calendarName, boxes) => {
      return await performApiCall({
        url: `${API_URL}/api/documents/analyze/save`,
        method: 'POST',
        body: { calendarName, boxes },
        origin: 'DOCUMENT_ANALYZE_SAVE',
        uid,
        analyticsEvent: 'DOCUMENT_ANALYZE_SAVE',
        analyticsData: { uid },
      });
    }, []);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const downloadPersonalCalendarPdf = useCallback(async (calendarId) => {
    const url = `${API_URL}/api/calendars/${calendarId}/pdf`;
    window.open(url, '_blank');
  }, []);

  // 🔐 Demande de permission et envoi du token
  const sendTokenToBackend = useCallback(async () => {

    const token = await requestPermissionAndGetToken(uid)
    if (!token) console.warn('FCM token not available');

    return await performApiCall({
      url: `${API_URL}/api/notifications/register-token`,
      method: 'POST',
      body: { token },
      origin: 'FCM_TOKEN_SEND',
      uid,
      analyticsEvent: 'FCM_TOKEN_SEND',
      analyticsData: { uid, token },
    });
  } , []);
  

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
      fetchIfPersonalPillboxUsed,
      useMedicinesForPersonalPillbox,
      cancelUsePersonalPillbox,
      fetchPersonalPillboxUses,
      fetchPersonalStockDecrementMethod,
      updatePersonalStockDecrementMethod,
      personalRestockBox,
      fetchPersonalNotificationsEnabled,
      updatePersonalNotificationsEnabled,
      analyzeImage,
      saveAnalysisResult,
      getTokensIcs,
      createTokenIcs,
      deleteTokenIcs,
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
      fetchIfSharedUserPillboxUsed,
      useMedicinesForSharedUserPillbox,
      cancelUseSharedUserPillbox,
      fetchSharedUserPillboxUses,
      sharedUserRestockBox,
      fetchSharedUserNotificationsEnabled,
      updateSharedUserNotificationsEnabled,
      fetchSharedUserStockDecrementMethod,
      getSharedTokensIcs,
      createSharedTokenIcs,
      deleteSharedTokenIcs,
    },

    tokenCalendars: {
      fetchTokenCalendarSchedule,
      createToken,
      updateTokenExpiration,
      deleteToken,
      tokensList,
      setTokensList,
    },

    notifications: {
      readNotification,
      notificationsData,
      setNotificationsData,
    },
    fcm: {
      sendTokenToBackend,
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
      sendTokenToBackend();
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
  useSEO({
    title: t('home_meta.title'),
    description: t('home_meta.description'),
    path
  });

  return (
    <div className="d-flex flex-column min-vh-100">
      <OnboardingTour isAppLoading={isInitialLoading} />
      <Navbar sharedProps={sharedProps} />
      <main className="flex-grow-1 d-flex flex-column safe-bottom">
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

        <div className="container mt-4 mb-3">
          <AppRoutes sharedProps={sharedProps} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
