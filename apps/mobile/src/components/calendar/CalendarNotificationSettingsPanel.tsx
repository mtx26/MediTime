import { Platform, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MobileCalendarNotificationSettingsProps } from '@meditime/types';
import { SettingsPanelSection } from '../settings';
import { useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export function CalendarNotificationSettingsPanel({
  enabled,
  isSaving,
  onToggle,
}: MobileCalendarNotificationSettingsProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <SettingsPanelSection
      glass
      iconName="notifications-outline"
      title={String(t('calendar_settings.notifications.label'))}
      description={String(t('calendar_settings.notifications.description'))}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <YStack style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 21, fontWeight: '800' }}>
            {enabled ? t('calendar_settings.notifications.enabled') : t('calendar_settings.notifications.disabled')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {enabled
              ? t('calendar_settings.notifications.enabled_hint')
              : t('calendar_settings.notifications.disabled_hint')}
          </Text>
        </YStack>
        <Switch
          value={enabled}
          disabled={isSaving}
          onValueChange={() => {
            hapticSelection();
            onToggle();
          }}
          trackColor={{ false: ios.border, true: ios.primary }}
          ios_backgroundColor={Platform.OS === 'ios' ? ios.border : undefined}
        />
      </XStack>
    </SettingsPanelSection>
  );
}
