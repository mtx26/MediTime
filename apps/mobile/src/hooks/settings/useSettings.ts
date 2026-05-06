import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { enabledLanguageCodes, getFlag, getLabel } from '@meditime/config';
import { SETTINGS_TABS } from '@meditime/constants';
import { buildUserUpdatePayload, getFirstRouteParam, getOAuthSignInOptions, log, performApiCall } from '@meditime/utils';
import type { OAuthProvider, SettingsTabId, SettingsTabItem } from '@meditime/types';
import { authService } from '../../contexts/AuthContext';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../services/supabase';
import { useAppTheme } from '../../theme/ios';
import { MOBILE_LANGUAGE_STORAGE_KEY } from '../../i18n';
import {
  applySupabaseAuthCallback,
  buildMobileAuthCallbackUrl,
  openAuthUrlInApp,
} from '../../utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

function normalizeTab(tab: string | string[] | undefined): SettingsTabId {
  const value = getFirstRouteParam(tab);
  const knownTabs = Object.values(SETTINGS_TABS) as SettingsTabId[];
  return knownTabs.includes(value as SettingsTabId)
    ? value as SettingsTabId
    : SETTINGS_TABS.ACCOUNT as SettingsTabId;
}

export function useSettings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userInfo, isLoading, reloadUser, signOut } = useAuth();
  const { themePreference, setThemePreference } = useAppTheme();
  const [activeTab, setActiveTabState] = useState<SettingsTabId>(() => normalizeTab(params.tab));
  const [displayName, setDisplayName] = useState(userInfo?.displayName ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [notificationTime, setNotificationTime] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(Boolean(userInfo?.emailEnabled));
  const [pushEnabled, setPushEnabled] = useState(Boolean(userInfo?.pushEnabled));
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    setActiveTabState(normalizeTab(params.tab));
  }, [params.tab]);

  useEffect(() => {
    setDisplayName(userInfo?.displayName ?? '');
  }, [userInfo?.displayName]);

  useEffect(() => {
    setEmailEnabled(Boolean(userInfo?.emailEnabled));
    setPushEnabled(Boolean(userInfo?.pushEnabled));
  }, [userInfo?.emailEnabled, userInfo?.pushEnabled]);

  const refreshNotificationTime = useCallback(async () => {
    if (!userInfo?.uid) return;

    const result = await performApiCall({
      url: `${API_URL}/api/user/notification-time`,
      method: 'GET',
      origin: 'NOTIFICATION_TIME_FETCH',
      uid: userInfo.uid,
    });

    if (!result.success) return;

    const time = typeof result.notification_time === 'string'
      ? result.notification_time.slice(0, 5)
      : '';
    setNotificationTime(time);
  }, [userInfo?.uid]);

  useEffect(() => {
    void refreshNotificationTime();
  }, [refreshNotificationTime]);

  const tabs = useMemo<SettingsTabItem<keyof typeof Ionicons.glyphMap, SettingsTabId>[]>(() => [
    { id: SETTINGS_TABS.ACCOUNT as SettingsTabId, label: String(t('settings.account')), iconName: 'person-circle-outline' },
    { id: SETTINGS_TABS.SECURITY as SettingsTabId, label: String(t('settings.security')), iconName: 'shield-checkmark-outline' },
    { id: SETTINGS_TABS.NOTIFICATIONS as SettingsTabId, label: String(t('notifications')), iconName: 'notifications-outline' },
    { id: SETTINGS_TABS.PREFERENCES as SettingsTabId, label: String(t('settings.preferences')), iconName: 'options-outline' },
  ], [t]);

  const availableProviders = useMemo(() => [
    { id: 'google' as OAuthProvider, name: 'Google', iconName: 'logo-google' as keyof typeof Ionicons.glyphMap, color: '#DB4437' },
    { id: 'github' as OAuthProvider, name: 'GitHub', iconName: 'logo-github' as keyof typeof Ionicons.glyphMap, color: '#111111' },
    { id: 'twitter' as OAuthProvider, name: 'Twitter', iconName: 'logo-twitter' as keyof typeof Ionicons.glyphMap, color: '#111111' },
    { id: 'facebook' as OAuthProvider, name: 'Facebook', iconName: 'logo-facebook' as keyof typeof Ionicons.glyphMap, color: '#1877F2' },
    { id: 'discord' as OAuthProvider, name: 'Discord', iconName: 'logo-discord' as keyof typeof Ionicons.glyphMap, color: '#5865F2' },
    { id: 'azure' as OAuthProvider, name: 'Microsoft', iconName: 'logo-windows' as keyof typeof Ionicons.glyphMap, color: '#5E5E5E' },
  ], []);

  const refreshLinkedProviders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingProviders(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      setLinkedProviders(user?.identities?.map((identity) => identity.provider) ?? []);
    } catch (providerError) {
      log.error('Erreur lors du chargement des providers', {
        origin: 'MOBILE_SETTINGS_PROVIDERS',
        error: providerError,
      });
    } finally {
      if (showLoading) setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    if (!userInfo?.uid) return;
    void refreshLinkedProviders();
  }, [refreshLinkedProviders, userInfo?.uid]);

  const setActiveTab = useCallback((tab: SettingsTabId) => {
    setActiveTabState(tab);
    router.setParams({ tab });
  }, [router]);

  const runSavingAction = useCallback(async (action: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await action();
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateUserInfo = useCallback(async (body: ReturnType<typeof buildUserUpdatePayload>) => {
    if (!userInfo?.uid) {
      return { success: false, error: String(t('verify_email.no_user')) };
    }

    return performApiCall({
      url: `${API_URL}/api/user/update`,
      method: 'PUT',
      body,
      origin: 'USER_UPDATE',
      uid: userInfo.uid,
    });
  }, [t, userInfo?.uid]);

  const saveDisplayName = useCallback(async () => {
    await runSavingAction(async () => {
      await updateUserInfo(buildUserUpdatePayload({
        display_name: displayName.trim() || null,
      }));

      await reloadUser();
    });
  }, [displayName, reloadUser, runSavingAction, updateUserInfo]);

  const resetDisplayName = useCallback(() => {
    setDisplayName(userInfo?.displayName ?? '');
  }, [userInfo?.displayName]);

  const promptDisplayName = useCallback(() => {
    Alert.prompt(
      String(t('account.display_name.label')),
      String(t('account.display_name.hint')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('account.save_changes')),
          onPress: (value?: string) => {
            const trimmed = (value ?? '').trim();
            setDisplayName(trimmed);
            void runSavingAction(async () => {
              await updateUserInfo(buildUserUpdatePayload({ display_name: trimmed || null }));
              await reloadUser();
            });
          },
        },
      ],
      'plain-text',
      displayName,
      'default',
    );
  }, [displayName, reloadUser, runSavingAction, t, updateUserInfo]);

  const changePhoto = useCallback(async () => {
    if (!userInfo?.uid) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.88,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const maxSize = 1024 * 1024 * 5;

    if (typeof asset.fileSize === 'number' && asset.fileSize > maxSize) {
      return;
    }

    await runSavingAction(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        name: asset.fileName ?? `profile-${userInfo.uid}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(`${API_URL}/api/user/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        await reloadUser();
        return;
      }

      await reloadUser();
    });
  }, [reloadUser, runSavingAction, t, userInfo?.uid]);

  const updatePassword = useCallback(async () => {
    if (!userInfo?.email || !oldPassword) {
      return;
    }
    const email = userInfo.email;

    if (oldPassword === newPassword) {
      return;
    }

    await runSavingAction(async () => {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (loginError) {
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        log.error('Erreur lors du changement de mot de passe', updateError, {
          origin: 'MOBILE_SETTINGS_PASSWORD_UPDATE',
        });
        return;
      }

      setOldPassword('');
      setNewPassword('');
    });
  }, [newPassword, oldPassword, runSavingAction, t, userInfo?.email]);

  const connectProvider = useCallback(async (provider: OAuthProvider) => {
    setConnectingProvider(provider);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          ...getOAuthSignInOptions(provider, buildMobileAuthCallbackUrl(undefined, 'oauth')),
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        return;
      }

      if (data.url) {
        const callbackUrl = await openAuthUrlInApp(data.url);
        if (callbackUrl) {
          await applySupabaseAuthCallback(supabase, callbackUrl);
        }
      }

      await refreshLinkedProviders();
    } catch (providerError) {
      log.error('Erreur lors de la connexion du provider', {
        origin: 'MOBILE_SETTINGS_PROVIDER_CONNECT',
        provider,
        error: providerError,
      });
    } finally {
      setConnectingProvider(null);
    }
  }, [refreshLinkedProviders, t]);

  const refreshSettings = useCallback(async () => {
    if (!userInfo?.uid) return;

    setIsRefreshing(true);
    try {
      await Promise.all([
        reloadUser(),
        refreshNotificationTime(),
        refreshLinkedProviders(false),
      ]);
    } catch (refreshError) {
      log.error('Erreur lors du rafraichissement des settings mobiles', {
        origin: 'MOBILE_SETTINGS_REFRESH',
        error: refreshError,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLinkedProviders, refreshNotificationTime, reloadUser, userInfo?.uid]);

  const updateNotificationFlag = useCallback(async (
    key: 'email_enabled' | 'push_enabled',
    value: boolean,
  ) => {
    if (key === 'email_enabled') {
      setEmailEnabled(value);
    } else {
      setPushEnabled(value);
    }

    await runSavingAction(async () => {
      await updateUserInfo(buildUserUpdatePayload({ [key]: value }));
      await reloadUser();
    });
  }, [reloadUser, runSavingAction, updateUserInfo]);

  const updateNotificationTime = useCallback((value: string) => {
    setNotificationTime(value);
  }, []);

  const saveNotificationTime = useCallback(async (nextTime?: string) => {
    if (!userInfo?.uid) return;

    const targetTime = nextTime ?? notificationTime;

    if (!/^\d{2}:\d{2}$/.test(targetTime)) {
      return;
    }

    const [hours, minutes] = targetTime.split(':').map(Number);
    if (hours > 23 || minutes > 59) {
      return;
    }

    await runSavingAction(async () => {
      await performApiCall({
        url: `${API_URL}/api/user/notification-time`,
        method: 'PUT',
        body: { notification_time: targetTime },
        origin: 'NOTIFICATION_TIME_UPDATE',
        uid: userInfo.uid,
      });

      await refreshNotificationTime();
    });
  }, [notificationTime, refreshNotificationTime, runSavingAction, t, userInfo?.uid]);

  const resetPassword = useCallback(async () => {
    if (!userInfo?.email) return;

    try {
      await authService.resetPassword(userInfo.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(t('unexpected_error'));
      Alert.alert(String(t('error')), message);
      return;
    }

    Alert.alert(String(t('reset_password.title')), String(t('reset_password.success')));
  }, [t, userInfo?.email]);

  const confirmLogout = useCallback(() => {
    Alert.alert(String(t('logout')), String(t('logout')), [
      { text: String(t('cancel')), style: 'cancel' },
      {
        text: String(t('logout')),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut, t]);

  const changeLanguage = useCallback((language: string) => {
    void (async () => {
      await SecureStore.setItemAsync(MOBILE_LANGUAGE_STORAGE_KEY, language);
      await i18n.changeLanguage(language);
    })();
  }, [i18n]);

  return {
    activeTab,
    tabs,
    userInfo,
    isLoading,
    isRefreshing,
    emailEnabled,
    pushEnabled,
    displayName,
    oldPassword,
    newPassword,
    oldPasswordVisible,
    newPasswordVisible,
    notificationTime,
    isSaving,
    availableProviders,
    linkedProviders,
    loadingProviders,
    connectingProvider,
    language: i18n.language,
    languages: enabledLanguageCodes.map((code) => ({ code, flag: getFlag(code), label: getLabel(code) })),
    themePreference,
    setActiveTab,
    setDisplayName,
    changePhoto,
    saveDisplayName,
    resetDisplayName,
    promptDisplayName,
    setOldPassword,
    setNewPassword,
    setOldPasswordVisible,
    setNewPasswordVisible,
    updatePassword,
    connectProvider,
    updateEmailNotifications: (value: boolean) => void updateNotificationFlag('email_enabled', value),
    updatePushNotifications: (value: boolean) => void updateNotificationFlag('push_enabled', value),
    updateNotificationTime,
    saveNotificationTime,
    changeLanguage,
    setThemePreference,
    resetPassword,
    confirmLogout,
    refreshSettings,
  };
}
