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
  providers,
  linkedProviders,
  loadingProviders,
  connectingProvider,
  onOldPasswordChange,
  onNewPasswordChange,
  onOldPasswordVisibleChange,
  onNewPasswordVisibleChange,
  onUpdatePassword,
  onResetPassword,
  onConnectProvider,
}: MobileSecuritySettingsProps<keyof typeof Ionicons.glyphMap>) {
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

        <YStack
          style={{
            gap: 12,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: ios.border,
          }}
        >
          <Text style={{ color: ios.foreground, fontSize: 13, lineHeight: 18, fontWeight: '900' }}>
            {t('security.providers.section_title')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            {t('security.providers.help_text')}
          </Text>

          {loadingProviders ? (
            <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
              {t('loading')}
            </Text>
          ) : (
            <YStack style={{ gap: 10 }}>
              {providers.map((provider) => {
                const isLinked = linkedProviders.includes(provider.id);
                const isConnecting = connectingProvider === provider.id;

                return (
                  <XStack
                    key={provider.id}
                    style={{
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: ios.border,
                      borderRadius: 8,
                      backgroundColor: ios.background,
                    }}
                  >
                    <YStack
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: ios.border,
                        backgroundColor: ios.card,
                      }}
                    >
                      <Ionicons name={provider.iconName} size={20} color={provider.color} />
                    </YStack>
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}
                    >
                      {provider.name}
                    </Text>

                    {isLinked ? (
                      <XStack
                        style={{
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 9,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: ios.successBg,
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={15} color={ios.success} />
                        <Text style={{ color: ios.success, fontSize: 12, fontWeight: '900' }}>
                          {t('security.providers.connected')}
                        </Text>
                      </XStack>
                    ) : (
                      <Button
                        size="$3"
                        disabled={Boolean(connectingProvider)}
                        opacity={isConnecting ? 0.7 : 1}
                        onPress={() => onConnectProvider(provider.id)}
                      >
                        <Text style={{ color: ios.primary, fontSize: 12, fontWeight: '900' }}>
                          {isConnecting ? t('security.providers.connecting') : t('security.providers.connect')}
                        </Text>
                      </Button>
                    )}
                  </XStack>
                );
              })}
            </YStack>
          )}
        </YStack>
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

        <Button size="$4" onPress={onResetPassword}>
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="mail-outline" size={18} color={ios.primary} />
            <Text style={{ color: ios.primary, fontWeight: '800' }}>
              {t('reset_password.title')}
            </Text>
          </XStack>
        </Button>
      </SettingsPanelSection>
    </YStack>
  );
}
