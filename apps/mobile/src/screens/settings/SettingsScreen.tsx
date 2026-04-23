import { Redirect, Stack } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { SETTINGS_TABS } from '@meditime/constants';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import {
  AccountSettingsPanel,
  NotificationSettingsPanel,
  PreferencesSettingsPanel,
  SecuritySettingsPanel,
  SettingsTabBar,
} from '../../components/settings';
import { useSettings } from '../../hooks/settings';
import { useIosTheme } from '../../theme/ios';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const settings = useSettings();
  const headerOptions = usePageHeaderOptions({
    title: String(t('settings.label')),
  });

  if (settings.isLoading) {
    return <LoadingIndicator label={String(t('loading_settings'))} variant="screen" />;
  }

  if (!settings.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={settings.isRefreshing}
          onRefresh={() => void settings.refreshSettings()}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={16}
      withBottomTabInset
    >
      <SettingsTabBar
        tabs={settings.tabs}
        activeTab={settings.activeTab}
        onTabChange={settings.setActiveTab}
      />

      {settings.activeTab === SETTINGS_TABS.SECURITY && (
        <SecuritySettingsPanel
          email={settings.userInfo.email ?? ''}
          oldPassword={settings.oldPassword}
          newPassword={settings.newPassword}
          oldPasswordVisible={settings.oldPasswordVisible}
          newPasswordVisible={settings.newPasswordVisible}
          isSaving={settings.isSaving}
          providers={settings.availableProviders}
          linkedProviders={settings.linkedProviders}
          loadingProviders={settings.loadingProviders}
          connectingProvider={settings.connectingProvider}
          onOldPasswordChange={settings.setOldPassword}
          onNewPasswordChange={settings.setNewPassword}
          onOldPasswordVisibleChange={settings.setOldPasswordVisible}
          onNewPasswordVisibleChange={settings.setNewPasswordVisible}
          onUpdatePassword={settings.updatePassword}
          onResetPassword={settings.resetPassword}
          onConnectProvider={settings.connectProvider}
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
        <Button size="$4" onPress={settings.confirmLogout}>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="log-out-outline" size={18} color={ios.destructive} />
            <Text style={{ color: ios.destructive, fontWeight: '800' }}>
              {t('logout')}
            </Text>
          </XStack>
        </Button>
      </YStack>
    </Page>
  );
}
