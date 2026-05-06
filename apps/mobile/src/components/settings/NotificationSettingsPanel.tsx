import { useMemo, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Linking, Platform, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MobileNotificationSettingsProps } from '@meditime/types';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

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
  const { colorScheme } = useAppTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pickerValue = useMemo(() => {
    const next = new Date();
    next.setSeconds(0, 0);

    const match = /^(\d{2}):(\d{2})$/.exec(notificationTime);
    if (!match) {
      next.setHours(8, 0, 0, 0);
      return next;
    }

    next.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return next;
  }, [notificationTime]);

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const nextTime = `${hours}:${minutes}`;
    if (nextTime !== notificationTime) hapticSelection();

    if (Platform.OS === 'android') {
      onNotificationTimeChange(nextTime);
      void onSaveNotificationTime(nextTime);
      return;
    }

    onNotificationTimeChange(nextTime);
    void onSaveNotificationTime(nextTime);
  };

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
        glass
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
            onValueChange={(value) => {
              hapticSelection();
              onEmailEnabledChange(value);
            }}
            trackColor={{ false: ios.border, true: ios.primary }}
            ios_backgroundColor={Platform.OS === 'ios' ? ios.border : undefined}
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
            onValueChange={(value) => {
              hapticSelection();
              onPushEnabledChange(value);
            }}
            trackColor={{ false: ios.border, true: ios.primary }}
            ios_backgroundColor={Platform.OS === 'ios' ? ios.border : undefined}
          />
        </XStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        glass
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
          {Platform.OS === 'ios' ? (
            <XStack
              style={{
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingVertical: 2,
              }}
            >
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="compact"
                minuteInterval={5}
                themeVariant={colorScheme}
                onChange={handleTimeChange}
              />
            </XStack>
          ) : (
            <YStack
              style={{
                overflow: 'hidden',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: ios.border,
                backgroundColor: ios.background,
              }}
            >
              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowTimePicker(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={String(t('settings.notification_time_label'))}
              >
                {({ pressed }) => (
                  <XStack
                    style={{
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingHorizontal: 12,
                      backgroundColor: pressed ? ios.accentHover : ios.background,
                    }}
                  >
                    <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
                      {notificationTime || '08:00'}
                    </Text>
                    <Text style={{ color: ios.primary, fontSize: 14, lineHeight: 18, fontWeight: '600' }}>
                      {t('edit')}
                    </Text>
                  </XStack>
                )}
              </Pressable>

              {showTimePicker ? (
                <DateTimePicker
                  value={pickerValue}
                  mode="time"
                  display="default"
                  is24Hour
                  minuteInterval={5}
                  onChange={handleTimeChange}
                />
              ) : null}
            </YStack>
          )}
        </YStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        glass
        iconName="phone-portrait-outline"
        title={String(t('notification.system_settings'))}
        description={String(t('notification.system_settings_desc'))}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => void Linking.openSettings()}
        >
          {({ pressed }) => (
            <XStack
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Text style={{ color: ios.primary, fontSize: 15, fontWeight: '600' }}>
                {t('notification.open_system_settings')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={ios.primary} />
            </XStack>
          )}
        </Pressable>
      </SettingsPanelSection>
    </YStack>
  );
}
