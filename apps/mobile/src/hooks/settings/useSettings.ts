import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getLabel, enabledLanguageCodes } from '@meditime/config';
import { SETTINGS_TABS } from '@meditime/constants';
import { buildUserUpdatePayload, log, performApiCall } from '@meditime/utils';
import type { SettingsTabId, SettingsTabItem } from '@meditime/types';
import { authService } from '../../contexts/AuthContext';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../services/supabase';
import { useAppTheme } from '../../theme/ios';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

function normalizeTab(tab: string | string[] | undefined): SettingsTabId {
  const value = Array.isArray(tab) ? tab[0] : tab;
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;

    const loadNotificationTime = async () => {
      if (!userInfo?.uid) return;

      const result = await performApiCall({
        url: `${API_URL}/api/user/notification-time`,
        method: 'GET',
        origin: 'NOTIFICATION_TIME_FETCH',
        uid: userInfo.uid,
      });

      if (!active || !result.success) return;

      const time = typeof result.notification_time === 'string'
        ? result.notification_time.slice(0, 5)
        : '';
      setNotificationTime(time);
    };

    void loadNotificationTime();

    return () => {
      active = false;
    };
  }, [userInfo?.uid]);

  const tabs = useMemo<SettingsTabItem<keyof typeof Ionicons.glyphMap>[]>(() => [
    { id: SETTINGS_TABS.ACCOUNT as SettingsTabId, label: String(t('settings.account')), iconName: 'person-circle-outline' },
    { id: SETTINGS_TABS.SECURITY as SettingsTabId, label: String(t('settings.security')), iconName: 'shield-checkmark-outline' },
    { id: SETTINGS_TABS.NOTIFICATIONS as SettingsTabId, label: String(t('notifications')), iconName: 'notifications-outline' },
    { id: SETTINGS_TABS.PREFERENCES as SettingsTabId, label: String(t('settings.preferences')), iconName: 'options-outline' },
  ], [t]);

  const setActiveTab = useCallback((tab: SettingsTabId) => {
    setMessage(null);
    setError(null);
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
    setError(null);
    setMessage(null);

    await runSavingAction(async () => {
      const result = await updateUserInfo(buildUserUpdatePayload({
        display_name: displayName.trim() || null,
      }));

      if (result.success) {
        await reloadUser();
        setMessage(String(t('account.profile_updated')));
      } else {
        setError(result.error ?? String(t('account.profile_error')));
      }
    });
  }, [displayName, reloadUser, runSavingAction, t, updateUserInfo]);

  const resetDisplayName = useCallback(() => {
    setDisplayName(userInfo?.displayName ?? '');
    setMessage(null);
    setError(null);
  }, [userInfo?.displayName]);

  const changePhoto = useCallback(async () => {
    if (!userInfo?.uid) return;

    setError(null);
    setMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(String(t('image_upload.select_file_error')));
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
      setError(String(t('account.image_size_error')));
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
        setError(String(t('account.photo_error')));
        return;
      }

      await reloadUser();
      setMessage(String(t('account.photo_updated')));
    });
  }, [reloadUser, runSavingAction, t, userInfo?.uid]);

  const updatePassword = useCallback(async () => {
    setError(null);
    setMessage(null);

    if (!userInfo?.email || !oldPassword) {
      setError(String(t('security.current_password.required')));
      return;
    }
    const email = userInfo.email;

    if (oldPassword === newPassword) {
      setError(String(t('security.password_section.same_password_error')));
      return;
    }

    await runSavingAction(async () => {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (loginError) {
        setError(String(t('security.current_password.incorrect')));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        log.error('Erreur lors du changement de mot de passe', updateError, {
          origin: 'MOBILE_SETTINGS_PASSWORD_UPDATE',
        });
        setError(updateError.message || String(t('security.password_section.error')));
        return;
      }

      setOldPassword('');
      setNewPassword('');
      setMessage(String(t('security.password_updated')));
    });
  }, [newPassword, oldPassword, runSavingAction, t, userInfo?.email]);

  const updateNotificationFlag = useCallback(async (
    key: 'email_enabled' | 'push_enabled',
    value: boolean,
  ) => {
    setError(null);
    setMessage(null);

    if (key === 'email_enabled') {
      setEmailEnabled(value);
    } else {
      setPushEnabled(value);
    }

    await runSavingAction(async () => {
      const result = await updateUserInfo(buildUserUpdatePayload({ [key]: value }));

      if (result.success) {
        await reloadUser();
        setMessage(String(t('account.profile_updated')));
      } else {
        if (key === 'email_enabled') {
          setEmailEnabled(!value);
        } else {
          setPushEnabled(!value);
        }
        setError(result.error ?? String(t('supabase-error.unexpected_error')));
      }
    });
  }, [reloadUser, runSavingAction, t, updateUserInfo]);

  const updateNotificationTime = useCallback((value: string) => {
    setNotificationTime(value);
    setError(null);
    setMessage(null);
  }, []);

  const saveNotificationTime = useCallback(async () => {
    if (!userInfo?.uid) return;

    if (!/^\d{2}:\d{2}$/.test(notificationTime)) {
      setError(String(t('settings.notification_time_label')));
      return;
    }

    const [hours, minutes] = notificationTime.split(':').map(Number);
    if (hours > 23 || minutes > 59) {
      setError(String(t('settings.notification_time_label')));
      return;
    }

    setError(null);
    setMessage(null);

    await runSavingAction(async () => {
      const result = await performApiCall({
        url: `${API_URL}/api/user/notification-time`,
        method: 'PUT',
        body: { notification_time: notificationTime },
        origin: 'NOTIFICATION_TIME_UPDATE',
        uid: userInfo.uid,
      });

      if (result.success) {
        setMessage(String(t('account.profile_updated')));
      } else {
        setError(result.error ?? String(t('supabase-error.unexpected_error')));
      }
    });
  }, [notificationTime, runSavingAction, t, userInfo?.uid]);

  const resetPassword = useCallback(async () => {
    if (!userInfo?.email) return;
    await authService.resetPassword(userInfo.email);
    setMessage(String(t('reset_password.success')));
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
    void i18n.changeLanguage(language);
  }, [i18n]);

  return {
    activeTab,
    tabs,
    userInfo,
    isLoading,
    emailEnabled,
    pushEnabled,
    displayName,
    oldPassword,
    newPassword,
    oldPasswordVisible,
    newPasswordVisible,
    notificationTime,
    isSaving,
    message,
    error,
    language: i18n.language,
    languages: enabledLanguageCodes.map((code) => ({ code, label: getLabel(code) })),
    themePreference,
    setActiveTab,
    setDisplayName,
    changePhoto,
    saveDisplayName,
    resetDisplayName,
    setOldPassword,
    setNewPassword,
    setOldPasswordVisible,
    setNewPasswordVisible,
    updatePassword,
    updateEmailNotifications: (value: boolean) => void updateNotificationFlag('email_enabled', value),
    updatePushNotifications: (value: boolean) => void updateNotificationFlag('push_enabled', value),
    updateNotificationTime,
    saveNotificationTime,
    changeLanguage,
    setThemePreference,
    resetPassword,
    confirmLogout,
  };
}
