import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, XStack, YStack } from 'tamagui';
import type { MobileSecuritySettingsProps } from '@meditime/types';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useIosTheme } from '../../theme/ios';

export function SecuritySettingsPanel({
  email,
  oldPassword,
  newPassword,
  oldPasswordVisible,
  newPasswordVisible,
  isSaving,
  onOldPasswordChange,
  onNewPasswordChange,
  onOldPasswordVisibleChange,
  onNewPasswordVisibleChange,
  onUpdatePassword,
}: MobileSecuritySettingsProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 14 }}>
      <YStack style={{ gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('security.title')}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {t('security.instructions')}
        </Text>
      </YStack>

      <SettingsPanelSection
        iconName="mail-outline"
        title={String(t('security.email_auth.title'))}
        description={String(t('security.email_auth.description'))}
      >
        <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
          {t('security.current_email')}
        </Text>
        <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 22, fontWeight: '800' }}>
          {email}
        </Text>
      </SettingsPanelSection>

      <SettingsPanelSection
        iconName="lock-closed-outline"
        title={String(t('security.password_section.title'))}
        description={String(t('security.password_section.description'))}
      >
        <YStack style={{ gap: 8 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
            {t('security.current_password.label')}
          </Text>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Input
              flex={1}
              size="$4"
              value={oldPassword}
              placeholder={t('security.current_password.placeholder')}
              secureTextEntry={!oldPasswordVisible}
              autoComplete="current-password"
              onChangeText={onOldPasswordChange}
            />
            <Button
              size="$3"
              chromeless
              onPress={() => onOldPasswordVisibleChange(!oldPasswordVisible)}
            >
              <Ionicons
                name={oldPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={ios.mutedForeground}
              />
            </Button>
          </XStack>
        </YStack>

        <YStack style={{ gap: 8 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
            {t('reset_password_confirm.new_password_label')}
          </Text>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Input
              flex={1}
              size="$4"
              value={newPassword}
              placeholder={t('security.new_password.placeholder')}
              secureTextEntry={!newPasswordVisible}
              autoComplete="new-password"
              onChangeText={onNewPasswordChange}
            />
            <Button
              size="$3"
              chromeless
              onPress={() => onNewPasswordVisibleChange(!newPasswordVisible)}
            >
              <Ionicons
                name={newPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={ios.mutedForeground}
              />
            </Button>
          </XStack>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {t('security.password_section.hint')}
          </Text>
        </YStack>

        <Button
          size="$4"
          theme="blue"
          disabled={isSaving || !oldPassword || !newPassword}
          opacity={isSaving ? 0.7 : 1}
          onPress={onUpdatePassword}
        >
          {t('security.update_password')}
        </Button>
      </SettingsPanelSection>
    </YStack>
  );
}
