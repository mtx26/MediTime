import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { createNotificationsApi, log, performApiCall } from '@meditime/utils';
import { useAuth } from '../auth/useAuth';
import { toMobileHref } from '../../utils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getExpoProjectId() {
  return Constants.easConfig?.projectId
    ?? Constants.expoConfig?.extra?.eas?.projectId
    ?? null;
}

function resolveNotificationHref(data: Record<string, unknown> | null | undefined) {
  if (!data) return '/notifications';

  const rawHref = typeof data.href === 'string'
    ? data.href
    : typeof data.link === 'string'
      ? data.link
      : null;

  if (!rawHref) return '/notifications';
  return rawHref.startsWith('/') ? toMobileHref(rawHref) : toMobileHref(new URL(rawHref).pathname + new URL(rawHref).search);
}

async function ensurePushPermissions() {
  const currentPermissions = await Notifications.getPermissionsAsync();
  let status = currentPermissions.status;

  if (status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    status = requestedPermissions.status;
  }

  return status === 'granted';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#0A84FF',
  });
}

async function getExpoPushToken() {
  const projectId = getExpoProjectId();

  if (!projectId) {
    throw new Error('Missing EAS projectId for Expo push notifications.');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return {
    token: token.data,
    projectId,
  };
}

export function PushNotificationsBootstrap() {
  const router = useRouter();
  const { userInfo, isLoading } = useAuth();
  const notificationsApi = useMemo(
    () => createNotificationsApi({
      apiUrl: process.env.EXPO_PUBLIC_API_URL!,
      uid: userInfo?.uid,
      performApiCall,
    }),
    [userInfo?.uid],
  );
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const lastHandledResponseRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !userInfo?.uid || userInfo.pushEnabled === false) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const permissionGranted = await ensurePushPermissions();
        if (!permissionGranted) {
          log.info('Notifications push refusees par l utilisateur', {
            origin: 'PUSH_TOKEN_SEND',
            uid: userInfo.uid,
            platform: Platform.OS,
          });
          return;
        }

        await ensureAndroidChannel();

        const { token: pushToken, projectId } = await getExpoPushToken();
        if (!active || !pushToken || pushToken === lastRegisteredTokenRef.current) {
          return;
        }

        const result = await notificationsApi.registerPushToken(pushToken, {
          deviceName: Platform.OS,
          platform: Platform.OS,
          provider: 'expo',
          projectId,
        });
        if (result.success) {
          lastRegisteredTokenRef.current = pushToken;
        }
      } catch (error) {
        log.error('Erreur lors de l enregistrement du push token Expo', {
          origin: 'PUSH_TOKEN_SEND',
          uid: userInfo.uid,
          platform: Platform.OS,
          error,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [isLoading, notificationsApi, userInfo?.pushEnabled, userInfo?.uid]);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      const notificationId = response?.notification.request.identifier ?? null;
      if (!response || !notificationId || notificationId === lastHandledResponseRef.current) {
        return;
      }

      lastHandledResponseRef.current = notificationId;

      const href = resolveNotificationHref(
        response.notification.request.content.data as Record<string, unknown> | undefined,
      );

      router.push(href as never);
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => undefined);

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  return null;
}