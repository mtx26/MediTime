import { useRef, type ElementRef } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { H2, Input, ScrollView, Separator, Text, XStack, YStack } from 'tamagui';
import type { AuthScreenProps } from '@meditime/types';
import { AuthModeToggle, PasswordInput, SocialProviderButton } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LiquidButton } from '../../components/common/LiquidButton';
import { MobileForm } from '../../components/common/MobileForm';
import { useAuthForm } from '../../hooks/auth/useAuthForm';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export default function AuthScreen({ initialMode }: AuthScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const auth = useAuthForm(initialMode);
  const isLogin = auth.activeMode === 'login';
  const nameInputRef = useRef<ElementRef<typeof Input>>(null);
  const emailInputRef = useRef<ElementRef<typeof Input>>(null);
  const passwordInputRef = useRef<ElementRef<typeof Input>>(null);

  if (auth.success) {
    return (
      <YStack
        flex={1}
        gap="$4"
        style={{ justifyContent: 'center', padding: 20, backgroundColor: ios.background }}
      >
        <YStack style={{ alignItems: 'center', gap: 12 }}>
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 32,
            }}
          >
            <Ionicons name="mail-outline" size={34} color={ios.primary} />
          </GlassView>
          <H2 style={{ textAlign: 'center', color: ios.foreground }}>
            {t('auth.verification_sent')}
          </H2>
          <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontSize: 16, lineHeight: 23 }}>
            {t('auth.check_email')}
          </Text>
        </YStack>
        <LiquidButton label={t('auth.back_to_login')} onPress={auth.goToLogin} />
      </YStack>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: ios.background }}
    >
      <ScrollView flex={1} keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: ios.background }}>
        <YStack
          flex={1}
          style={{
            minHeight: '100%',
            justifyContent: 'center',
            paddingHorizontal: 18,
            paddingVertical: 28,
            backgroundColor: ios.background,
          }}
        >
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              width: '100%',
              maxWidth: 460,
              alignSelf: 'center',
              borderRadius: 24,
              padding: 8,
            }}
          >
            <YStack style={{ gap: 18, padding: 10 }}>
            <YStack style={{ alignItems: 'center', gap: 10 }}>
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  width: 58,
                  height: 58,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                }}
              >
                <Image
                  source={require('../../../assets/icons/og-image.png')}
                  style={{ width: 48, height: 48 }}
                  resizeMode="contain"
                />
              </GlassView>
              <H2 style={{ textAlign: 'center', color: ios.foreground }}>
                {t('app.shortName')}
              </H2>
              <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {isLogin ? t('auth.login') : t('auth.register')}
              </Text>
            </YStack>

            <AuthModeToggle activeMode={auth.activeMode} onModeChange={auth.switchMode} />

            {auth.error && (
              <InfoBanner iconName="warning-outline" text={auth.error} tone="warning" />
            )}

            <YStack style={{ gap: 12 }}>
              <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {isLogin ? t('auth.login_with') : t('auth.register_with')}
              </Text>
              <XStack style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                {auth.providers.map((provider) => (
                  <SocialProviderButton
                    key={provider.id}
                    label={provider.label}
                    iconName={provider.iconName as keyof typeof Ionicons.glyphMap}
                    color={provider.color}
                    disabled={Boolean(auth.socialLoading)}
                    onPress={() => void auth.handleSocialLogin(provider.id)}
                  />
                ))}
              </XStack>
              <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
                {t('auth.or_with_email')}
              </Text>
            </YStack>

            <Separator />

            <MobileForm onSubmit={auth.handleSubmit} disabled={auth.loading || !auth.canSubmit} style={{ gap: 13 }}>
              {(form) => (
                <>
                  {!isLogin && (
                    <YStack style={{ gap: 7 }}>
                      <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                        {t('auth.name')} <Text style={{ color: ios.destructive }}>*</Text>
                      </Text>
                      <XStack style={{ alignItems: 'center', gap: 9 }}>
                        <Ionicons name="person-outline" size={20} color={ios.mutedForeground} />
                        <Input
                          ref={nameInputRef}
                          flex={1}
                          size="$4"
                          value={auth.name}
                          onChangeText={auth.setName}
                          autoCapitalize="words"
                          autoComplete="name"
                          returnKeyType="next"
                          onSubmitEditing={() => emailInputRef.current?.focus()}
                        />
                      </XStack>
                    </YStack>
                  )}

                  <YStack style={{ gap: 7 }}>
                    <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                      {t('auth.email')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <XStack style={{ alignItems: 'center', gap: 9 }}>
                      <Ionicons name="mail-outline" size={20} color={ios.mutedForeground} />
                      <Input
                        ref={emailInputRef}
                        flex={1}
                        size="$4"
                        value={auth.email}
                        onChangeText={auth.setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        borderColor={auth.emailValid ? undefined : '$red8'}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </XStack>
                  </YStack>

                  <YStack style={{ gap: 7 }}>
                    <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                      {t('auth.password')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <PasswordInput
                      ref={passwordInputRef}
                      value={auth.password}
                      onChangeText={auth.setPassword}
                      visible={auth.passwordVisible}
                      onVisibleChange={auth.setPasswordVisible}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      onSubmitEditing={form.submit}
                      returnKeyType="done"
                    />
                  </YStack>

                  {isLogin && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        hapticSelection();
                        auth.goToResetPassword();
                      }}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      {({ pressed }) => (
                        <GlassView
                          colorScheme={colorScheme}
                          glassEffectStyle="clear"
                          style={{
                            borderRadius: 18,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            opacity: pressed ? 0.75 : 1,
                          }}
                        >
                          <Text style={{ color: ios.primary, fontSize: 13, fontWeight: '800' }}>
                            {t('auth.forgot_password')}
                          </Text>
                        </GlassView>
                      )}
                    </Pressable>
                  )}

                  {!isLogin && (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: auth.termsAccepted }}
                      onPress={() => {
                        hapticSelection();
                        auth.setTermsAccepted(!auth.termsAccepted);
                      }}
                    >
                      {({ pressed }) => (
                        <XStack style={{ alignItems: 'flex-start', gap: 10, opacity: pressed ? 0.75 : 1 }}>
                          <GlassView
                            colorScheme={colorScheme}
                            glassEffectStyle="clear"
                            style={{
                              width: 22,
                              height: 22,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 8,
                            }}
                          >
                            {auth.termsAccepted && (
                              <Ionicons name="checkmark" size={16} color={ios.primary} />
                            )}
                          </GlassView>
                          <Text style={{ flex: 1, color: ios.foreground, fontSize: 13, lineHeight: 19 }}>
                            {t('auth.accept_terms')}
                            <Text style={{ color: ios.destructive }}> *</Text>
                            <Text
                              style={{ color: ios.primary, fontWeight: '800' }}
                              onPress={auth.goToTerms}
                            >
                              {t('auth.terms_link')}
                            </Text>
                          </Text>
                        </XStack>
                      )}
                    </Pressable>
                  )}

                  <LiquidButton
                    iconName={isLogin ? 'log-in-outline' : 'person-add-outline'}
                    label={auth.loading ? t('loading') : isLogin ? t('auth.login') : t('auth.register')}
                    disabled={auth.loading || !auth.canSubmit}
                    loading={auth.loading}
                    onPress={form.submit}
                  />
                </>
              )}
            </MobileForm>
            </YStack>
          </GlassView>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
