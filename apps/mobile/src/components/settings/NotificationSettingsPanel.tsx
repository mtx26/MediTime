import { Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, XStack, YStack } from 'tamagui';
import type { MobileNotificationSettingsProps } from '@meditime/types';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useIosTheme } from '../../theme/ios';

export function NotificationSettingsPanel({
  emailEnabled,
  pushEnabled,
  notificationTime,
  isSaving,
  onEmailEnabledChange,
  onPushEnabledChange,
  onNotificationTimeChange,
  onSaveNotificationTime,
}: MobileNotificationSettingsProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 14 }}>
      <YStack style={{ gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('notification.label')}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {t('notification.instructions')}
        </Text>
      </YStack>

      <SettingsPanelSection
        iconName="notifications-outline"
        title={String(t('notification.preferences.title'))}
        description={String(t('notification.preferences.description'))}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <YStack style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 21, fontWeight: '800' }}>
              {t('notification.email_toggle')}
            </Text>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {t('notification.email_description')}
            </Text>
          </YStack>
          <Switch
            value={emailEnabled}
            disabled={isSaving}
            onValueChange={onEmailEnabledChange}
            trackColor={{ false: ios.border, true: ios.primary }}
            thumbColor={ios.card}
          />
        </XStack>

        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <YStack style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 21, fontWeight: '800' }}>
              {t('notification.push_toggle')}
            </Text>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {t('notification.push_description')}
            </Text>
          </YStack>
          <Switch
            value={pushEnabled}
            disabled={isSaving}
            onValueChange={onPushEnabledChange}
            trackColor={{ false: ios.border, true: ios.primary }}
            thumbColor={ios.card}
          />
        </XStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        iconName="time-outline"
        title={String(t('settings.notification_time'))}
        description={String(t('settings.notification_time_desc'))}
      >
        <YStack style={{ gap: 8 }}>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 21, fontWeight: '800' }}>
            {t('settings.notification_time_label')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {t('settings.notification_time_note')}
          </Text>
          <Input
            size="$4"
            value={notificationTime}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            onChangeText={onNotificationTimeChange}
          />
          <Button
            size="$4"
            theme="blue"
            disabled={isSaving || !notificationTime}
            opacity={isSaving ? 0.7 : 1}
            onPress={onSaveNotificationTime}
          >
            {t('account.save_changes')}
          </Button>
        </YStack>
      </SettingsPanelSection>
    </YStack>
  );
}
