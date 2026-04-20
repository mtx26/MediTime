import { Image, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, H2, Input, ScrollView, Separator, Text, XStack, YStack } from 'tamagui';
import type { AuthScreenProps } from '@meditime/types';
import { AuthModeToggle, PasswordInput, SocialProviderButton } from '../components/auth';
import { InfoBanner } from '../components/common/InfoBanner';
import { useAuthForm } from '../hooks/auth/useAuthForm';
import { useIosTheme } from '../theme/ios';

export default function AuthScreen({ initialMode }: AuthScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const auth = useAuthForm(initialMode);
  const isLogin = auth.activeMode === 'login';

  if (auth.success) {
    return (
      <YStack
        flex={1}
        gap="$4"
        style={{ justifyContent: 'center', padding: 20, backgroundColor: ios.background }}
      >
        <YStack style={{ alignItems: 'center', gap: 12 }}>
          <YStack
            style={{
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 32,
              backgroundColor: ios.blueInfoBg,
            }}
          >
            <Ionicons name="mail-outline" size={34} color={ios.primary} />
          </YStack>
          <H2 style={{ textAlign: 'center', color: ios.foreground }}>
            {t('auth.verification_sent')}
          </H2>
          <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontSize: 16, lineHeight: 23 }}>
            {t('auth.check_email')}
          </Text>
        </YStack>
        <Button size="$4" theme="blue" onPress={auth.goToLogin}>
          <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
            {t('auth.back_to_login')}
          </Text>
        </Button>
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
          <YStack
            style={{
              width: '100%',
              maxWidth: 460,
              alignSelf: 'center',
              gap: 18,
              padding: 18,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ios.border,
              backgroundColor: ios.card,
            }}
          >
            <YStack style={{ alignItems: 'center', gap: 10 }}>
              <YStack
                style={{
                  width: 58,
                  height: 58,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: ios.blueInfoBg,
                }}
              >
                <Image
                  source={require('../../assets/icons/og-image.png')}
                  style={{ width: 48, height: 48 }}
                  resizeMode="contain"
                />
              </YStack>
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

            <YStack style={{ gap: 13 }}>
              {!isLogin && (
                <YStack style={{ gap: 7 }}>
                  <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                    {t('auth.name')}
                  </Text>
                  <XStack style={{ alignItems: 'center', gap: 9 }}>
                    <Ionicons name="person-outline" size={20} color={ios.mutedForeground} />
                    <Input
                      flex={1}
                      size="$4"
                      value={auth.name}
                      onChangeText={auth.setName}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </XStack>
                </YStack>
              )}

              <YStack style={{ gap: 7 }}>
                <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                  {t('auth.email')}
                </Text>
                <XStack style={{ alignItems: 'center', gap: 9 }}>
                  <Ionicons name="mail-outline" size={20} color={ios.mutedForeground} />
                  <Input
                    flex={1}
                    size="$4"
                    value={auth.email}
                    onChangeText={auth.setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </XStack>
              </YStack>

              <YStack style={{ gap: 7 }}>
                <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                  {t('auth.password')}
                </Text>
                <PasswordInput
                  value={auth.password}
                  onChangeText={auth.setPassword}
                  visible={auth.passwordVisible}
                  onVisibleChange={auth.setPasswordVisible}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </YStack>

              {isLogin && (
                <Button size="$3" chromeless style={{ alignSelf: 'flex-end' }} onPress={auth.goToResetPassword}>
                  <Text style={{ color: ios.primary, fontSize: 13, fontWeight: '800' }}>
                    {t('auth.forgot_password')}
                  </Text>
                </Button>
              )}

              {!isLogin && (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: auth.termsAccepted }}
                  onPress={() => auth.setTermsAccepted(!auth.termsAccepted)}
                >
                  {({ pressed }) => (
                    <XStack style={{ alignItems: 'flex-start', gap: 10, opacity: pressed ? 0.75 : 1 }}>
                      <YStack
                        style={{
                          width: 22,
                          height: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: auth.termsAccepted ? ios.primary : ios.border,
                          backgroundColor: auth.termsAccepted ? ios.primary : ios.card,
                        }}
                      >
                        {auth.termsAccepted && (
                          <Ionicons name="checkmark" size={16} color={ios.primaryForeground} />
                        )}
                      </YStack>
                      <Text style={{ flex: 1, color: ios.foreground, fontSize: 13, lineHeight: 19 }}>
                        {t('auth.accept_terms')}
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

              <Button
                size="$4"
                theme="blue"
                disabled={auth.loading || !auth.canSubmit}
                opacity={auth.loading ? 0.7 : 1}
                onPress={() => void auth.handleSubmit()}
              >
                <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons
                    name={isLogin ? 'log-in-outline' : 'person-add-outline'}
                    size={18}
                    color={ios.primaryForeground}
                  />
                  <Text style={{ color: ios.primaryForeground, fontWeight: '900' }}>
                    {auth.loading ? t('loading') : isLogin ? t('auth.login') : t('auth.register')}
                  </Text>
                </XStack>
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
