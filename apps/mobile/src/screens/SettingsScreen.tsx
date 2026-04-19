import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { SETTINGS_TABS } from '@meditime/constants';
import { InfoBanner } from '../components/common/InfoBanner';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import {
  AccountSettingsPanel,
  NotificationSettingsPanel,
  PreferencesSettingsPanel,
  SecuritySettingsPanel,
  SettingsTabBar,
} from '../components/settings';
import { useSettings } from '../hooks/settings';
import { useIosTheme } from '../theme/ios';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const settings = useSettings();
  const bottomContentInset = 56 + insets.bottom + 18;

  if (settings.isLoading) {
    return <LoadingIndicator label={String(t('loading_settings'))} variant="screen" />;
  }

  if (!settings.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScrollView flex={1} style={{ flex: 1, backgroundColor: ios.background }}>
      <YStack
        style={{
          flex: 1,
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 18),
          paddingBottom: bottomContentInset,
          backgroundColor: ios.background,
        }}
      >
        <YStack style={{ gap: 6 }}>
          <Text style={{ color: ios.foreground, fontSize: 28, lineHeight: 34, fontWeight: '900' }}>
            {t('settings.label')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
            {settings.userInfo.email}
          </Text>
        </YStack>

        <SettingsTabBar
          tabs={settings.tabs}
          activeTab={settings.activeTab}
          onTabChange={settings.setActiveTab}
        />

        {settings.message && (
          <InfoBanner iconName="checkmark-circle-outline" text={settings.message} />
        )}

        {settings.error && (
          <InfoBanner iconName="warning-outline" text={settings.error} tone="warning" />
        )}

        {settings.activeTab === SETTINGS_TABS.SECURITY && (
          <SecuritySettingsPanel
            email={settings.userInfo.email ?? ''}
            oldPassword={settings.oldPassword}
            newPassword={settings.newPassword}
            oldPasswordVisible={settings.oldPasswordVisible}
            newPasswordVisible={settings.newPasswordVisible}
            isSaving={settings.isSaving}
            onOldPasswordChange={settings.setOldPassword}
            onNewPasswordChange={settings.setNewPassword}
            onOldPasswordVisibleChange={settings.setOldPasswordVisible}
            onNewPasswordVisibleChange={settings.setNewPasswordVisible}
            onUpdatePassword={settings.updatePassword}
          />
        )}

        {settings.activeTab === SETTINGS_TABS.NOTIFICATIONS && (
          <NotificationSettingsPanel
            emailEnabled={settings.emailEnabled}
            pushEnabled={settings.pushEnabled}
            notificationTime={settings.notificationTime}
            isSaving={settings.isSaving}
            onEmailEnabledChange={settings.updateEmailNotifications}
            onPushEnabledChange={settings.updatePushNotifications}
            onNotificationTimeChange={settings.updateNotificationTime}
            onSaveNotificationTime={settings.saveNotificationTime}
          />
        )}

        {settings.activeTab === SETTINGS_TABS.PREFERENCES && (
          <PreferencesSettingsPanel
            language={settings.language}
            languages={settings.languages}
            themePreference={settings.themePreference}
            onLanguageChange={settings.changeLanguage}
            onThemePreferenceChange={settings.setThemePreference}
          />
        )}

        {settings.activeTab === SETTINGS_TABS.ACCOUNT && (
          <AccountSettingsPanel
            displayName={settings.displayName}
            email={settings.userInfo.email ?? ''}
            photoUrl={settings.userInfo.photoUrl}
            isSaving={settings.isSaving}
            onChangePhoto={settings.changePhoto}
            onDisplayNameChange={settings.setDisplayName}
            onSaveDisplayName={settings.saveDisplayName}
            onResetDisplayName={settings.resetDisplayName}
          />
        )}

        <YStack
          style={{
            gap: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: ios.border,
          }}
        >
          <Button size="$4" onPress={() => void settings.resetPassword()}>
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="mail-outline" size={18} color={ios.primary} />
              <Text style={{ color: ios.primary, fontWeight: '800' }}>
                {t('reset_password.title')}
              </Text>
            </XStack>
          </Button>

          <Button size="$4" onPress={settings.confirmLogout}>
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="log-out-outline" size={18} color={ios.destructive} />
              <Text style={{ color: ios.destructive, fontWeight: '800' }}>
                {t('logout')}
              </Text>
            </XStack>
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
