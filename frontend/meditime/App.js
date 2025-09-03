import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Import i18n AVANT les autres imports
import './src/i18n';

// Import de la logique métier (INCHANGÉE)
import { log } from './src/utils/logger';
import { UserContext, UserProvider } from './src/contexts/UserContext';
import { formatToLocalISODate } from './src/utils/calendar/dateUtils';
import { getToken } from './src/services/supabase/tokenUtils';
import { performApiCall } from './src/services/api/apiUtils';
import { useTranslation } from 'react-i18next';

// Import des composants React Native (NOUVEAUX)
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/components/common/LoadingScreen';
import RealtimeManager from './src/components/realtime/RealtimeManager';

// Variables d'environnement (à adapter pour React Native)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// Utilitaire fileToBase64 (INCHANGÉ)
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Stack = createStackNavigator();

// Composant App principal (sans provider)
function AppContent() {
  const { t, i18n } = useTranslation();
  
  // États identiques à la version web (INCHANGÉ)
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState(null);

  const { userInfo, isInitialized } = useContext(UserContext);
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

  // ================== FONCTIONS CALENDRIERS PERSONNELS ==================
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
  }, [uid]);

  const deleteCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}`,
      method: 'DELETE',
      origin: 'CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_calendar',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

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
  }, [uid]);

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
  }, [uid]);

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
  }, [uid]);

  const createPersonalBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0, dose = 0) => {
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
  }, [uid]);

  const deletePersonalBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'BOX_DELETE',
      uid,
      analyticsEvent: 'delete_personal_box',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

  const useMedicinesForPersonalPillbox = useCallback(async (calendarId, startDate = null) => {
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
  }, [uid]);

  const fetchPersonalStockDecrementMethod = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/stock-decrement-method`,
      method: 'GET',
      origin: 'PERSONNAL_STOCK_DECREMENT_METHOD_FETCH',
      uid,
      analyticsEvent: 'fetch_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

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
  }, [uid]);

  const personalRestockBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}/restock`,
      method: 'POST',
      origin: 'BOX_RESTOCK',
      uid,
      analyticsEvent: 'restock_personal_box',
      analyticsData: { calendarId, boxId, uid },
    });
  }, [uid]);

  const downloadPersonalCalendarPdf = useCallback(async (calendarId) => {
    // Note: À adapter pour React Native - peut-être utiliser expo-sharing ou expo-file-system
    const url = `${API_URL}/api/calendars/${calendarId}/pdf`;
    // Pour React Native, on pourrait implémenter un système de partage
    return { url };
  }, []);

  // ================== FONCTIONS TOKENS ==================
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

  const deleteToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/${token}`,
      method: 'DELETE',
      origin: 'TOKEN_DELETE',
      uid,
      analyticsEvent: 'delete_token',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const updateRevokeToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/revoke/${token}`,
      method: 'POST',
      origin: 'TOKEN_REVOKE',
      uid,
      analyticsEvent: 'update_revoke_token',
      analyticsData: { token, uid },
    });
  }, [uid]);

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
  }, [uid]);

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
  }, [uid]);

  // ================== FONCTIONS INVITATIONS ==================
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
  }, [uid]);

  const getLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/${token}`,
      method: 'GET',
      origin: 'GET_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'get_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const deleteLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/${token}`,
      method: 'DELETE',
      origin: 'DELETE_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'delete_shared_user',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const acceptLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/accept/${token}`,
      method: 'POST',
      origin: 'ACCEPT_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'accept_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const rejectLoginInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/login/reject/${token}`,
      method: 'POST',
      origin: 'REJECT_INVITATION_LOGIN',
      uid,
      analyticsEvent: 'reject_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const getRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/${token}`,
      method: 'GET',
      origin: 'GET_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'get_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const deleteRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/${token}`,
      method: 'DELETE',
      origin: 'DELETE_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'delete_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const acceptRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/accept/${token}`,
      method: 'POST',
      origin: 'ACCEPT_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'accept_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  const rejectRegistrationInvitation = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/registration/reject/${token}`,
      method: 'POST',
      origin: 'REJECT_INVITATION_REGISTRATION',
      uid,
      analyticsEvent: 'reject_invitation',
      analyticsData: { token, uid },
    });
  }, [uid]);

  // ================== FONCTIONS NOTIFICATIONS ==================
  const readNotification = useCallback(async (notificationId) => {
    return await performApiCall({
      url: `${API_URL}/api/notifications/${notificationId}`,
      method: 'POST',
      origin: 'NOTIFICATION_READ',
      uid,
      analyticsEvent: 'read_notification',
      analyticsData: { notificationId, uid },
    });
  }, [uid]);

  // ================== FONCTIONS CALENDRIERS PARTAGÉS ==================
  const deleteSharedCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}`,
      method: 'DELETE',
      origin: 'SHARED_CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_shared_calendar',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

  const fetchGroupedSharedCalendars = useCallback(async () => {
    return await performApiCall({
      url: `${API_URL}/api/shared/grouped`,
      method: 'GET',
      origin: 'SHARED_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_users',
      analyticsData: { uid },
    });
  }, [uid]);

  const fetchSharedUserCalendarSchedule = useCallback(async (calendarId, startDate = null) => {
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
  }, [uid]);

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
  }, [uid]);

  const createSharedUserBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0, dose = 0) => {
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
  }, [uid]);

  const deleteSharedUserBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'BOX_DELETE',
      uid,
      analyticsEvent: 'delete_shared_user_box',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

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
  }, [uid]);

  const sharedUserRestockBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}/restock`,
      method: 'POST',
      origin: 'BOX_RESTOCK',
      uid,
      analyticsEvent: 'restock_shared_user_box',
      analyticsData: { calendarId, boxId, uid },
    });
  }, [uid]);

  const fetchSharedUserNotificationsEnabled = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/notifications`,
      method: 'GET',
      origin: 'SHARED_USER_NOTIFICATIONS_ENABLED_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_user_notifications_enabled',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

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
  }, [uid]);

  const fetchSharedUserStockDecrementMethod = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/stock-decrement-method`,
      method: 'GET',
      origin: 'SHARED_USER_STOCK_DECREMENT_METHOD_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_user_stock_decrement_method',
      analyticsData: { calendarId, uid },
    });
  }, [uid]);

  // ================== FONCTIONS DOCUMENTS/IA ==================
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
  }, [uid]);

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
  }, [uid]);

  // ================== PROPS PARTAGÉES (IDENTIQUES) ==================
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
      analyzeImage,
      saveAnalysisResult,
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
      fetchSharedUserStockDecrementMethod,
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

  // ================== RESET DATA (IDENTIQUE) ==================
  const resetAppData = () => {
    setCalendarsData(null);
    setTokensList([]);
    setNotificationsData(null);
    setSharedCalendarsData(null);
  };

  // ================== EFFECTS (ADAPTÉS POUR REACT NATIVE) ==================
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

  // Notifications push avec Expo
  useEffect(() => {
    if (!userInfo?.uid) return;

    const configurePushNotifications = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          log.error('Failed to get push token for push notification!');
          return;
        }
        
        const tokenFcm = (await Notifications.getExpoPushTokenAsync()).data;
        const token = await getToken();
        
        if (!token || !userInfo?.uid) return;

        // Envoi du token au backend
        fetch(`${API_URL}/api/notifications/register-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: tokenFcm }),
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
      }
    };

    configurePushNotifications();
  }, [userInfo?.uid, t]);

  // Interface React Native (NOUVEAU)
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.container}>
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
          
          {!isInitialized || isInitialLoading ? (
            <LoadingScreen />
          ) : userInfo ? (
            <TabNavigator sharedProps={sharedProps} />
          ) : (
            <AuthNavigator />
          )}
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

// Composant principal avec providers
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
