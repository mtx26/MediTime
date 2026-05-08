import { useRef, type ElementRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Input, Text, XStack, YStack } from 'tamagui';
import type { MobileSecuritySettingsProps } from '@meditime/types';
import { PasswordInput } from '../auth';
import { LiquidButton } from '../common/LiquidButton';
import { MobileForm } from '../common/MobileForm';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useAppTheme, useIosTheme } from '../../theme/ios';

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
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const oldPasswordInputRef = useRef<ElementRef<typeof Input>>(null);
  const newPasswordInputRef = useRef<ElementRef<typeof Input>>(null);

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
        glass
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
                  <GlassView
                    key={provider.id}
                    colorScheme={colorScheme}
                    glassEffectStyle="clear"
                    style={{
                      padding: 9,
                      borderRadius: 16,
                    }}
                  >
                    <XStack style={{ alignItems: 'center', gap: 9 }}>
                      <GlassView
                        colorScheme={colorScheme}
                        glassEffectStyle="clear"
                        style={{
                          width: 30,
                          height: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 15,
                        }}
                      >
                        <Ionicons name={provider.iconName} size={17} color={provider.color} />
                      </GlassView>
                      <Text
                        numberOfLines={1}
                        style={{ flex: 1, color: ios.foreground, fontSize: 13, lineHeight: 18, fontWeight: '800' }}
                      >
                        {provider.name}
                      </Text>

                      {isLinked ? (
                        <GlassView
                          colorScheme={colorScheme}
                          glassEffectStyle="clear"
                          style={{
                            borderRadius: 14,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                          }}
                        >
                          <XStack style={{ alignItems: 'center', gap: 4 }}>
                            <Ionicons name="checkmark-circle-outline" size={13} color={ios.success} />
                            <Text style={{ color: ios.success, fontSize: 11, fontWeight: '900' }}>
                              {t('security.providers.connected')}
                            </Text>
                          </XStack>
                        </GlassView>
                      ) : (
                        <LiquidButton
                          disabled={Boolean(connectingProvider)}
                          loading={isConnecting}
                          label={isConnecting ? t('security.providers.connecting') : t('security.providers.connect')}
                          onPress={() => onConnectProvider(provider.id)}
                          size="sm"
                        />
                      )}
                    </XStack>
                  </GlassView>
                );
              })}
            </YStack>
          )}
        </YStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        glass
        iconName="lock-closed-outline"
        title={String(t('security.password_section.title'))}
        description={String(t('security.password_section.description'))}
      >
        <MobileForm onSubmit={onUpdatePassword} disabled={isSaving || !oldPassword || !newPassword} gap="$3">
          {(form) => (
            <>
              <YStack style={{ gap: 8 }}>
                <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                  {t('security.current_password.label')} <Text style={{ color: ios.destructive }}>*</Text>
                </Text>
                <PasswordInput
                  ref={oldPasswordInputRef}
                  value={oldPassword}
                  placeholder={t('security.current_password.placeholder')}
                  visible={oldPasswordVisible}
                  onChangeText={onOldPasswordChange}
                  onVisibleChange={onOldPasswordVisibleChange}
                  autoComplete="current-password"
                  returnKeyType="next"
                  onSubmitEditing={() => newPasswordInputRef.current?.focus()}
                />
              </YStack>

              <YStack style={{ gap: 8 }}>
                <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                  {t('reset_password_confirm.new_password_label')} <Text style={{ color: ios.destructive }}>*</Text>
                </Text>
                <PasswordInput
                  ref={newPasswordInputRef}
                  value={newPassword}
                  placeholder={t('security.new_password.placeholder')}
                  visible={newPasswordVisible}
                  onChangeText={onNewPasswordChange}
                  onVisibleChange={onNewPasswordVisibleChange}
                  autoComplete="new-password"
                  {...form.getInputProps()}
                />
                <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
                  {t('security.password_section.hint')}
                </Text>
              </YStack>

              <LiquidButton
                iconName="lock-closed-outline"
                label={t('security.update_password')}
                disabled={isSaving || !oldPassword || !newPassword}
                loading={isSaving}
                onPress={form.submit}
              />
            </>
          )}
        </MobileForm>

        <LiquidButton iconName="mail-outline" label={t('reset_password.title')} onPress={onResetPassword} />
      </SettingsPanelSection>
    </YStack>
  );
}
