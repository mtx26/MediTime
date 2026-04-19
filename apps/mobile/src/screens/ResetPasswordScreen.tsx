import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { Button, H2, Input, Text, XStack, YStack } from 'tamagui';
import { InfoBanner } from '../components/common/InfoBanner';
import { useResetPassword } from '../hooks/auth/useResetPassword';
import { useIosTheme } from '../theme/ios';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();
  const resetPassword = useResetPassword();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <YStack
        flex={1}
        gap="$4"
        style={{
          justifyContent: 'center',
          padding: 20,
          backgroundColor: ios.background,
        }}
      >
        <YStack gap="$2">
          <H2 style={{ textAlign: 'center' }} color="$color">
            {t('reset_password.title')}
          </H2>
          <Text style={{ textAlign: 'center' }} color="$gray10" fontSize="$4">
            {t('reset_password.instructions')}
          </Text>
        </YStack>

        {resetPassword.sent && (
          <InfoBanner iconName="checkmark-circle-outline" text={String(t('reset_password.success'))} />
        )}

        {resetPassword.error && (
          <InfoBanner iconName="warning-outline" text={resetPassword.error} tone="warning" />
        )}

        <XStack style={{ alignItems: 'center' }} gap="$2">
          <Mail size={20} color="$gray10" />
          <Input
            flex={1}
            size="$4"
            placeholder={t('auth.email')}
            value={resetPassword.email}
            onChangeText={resetPassword.setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            borderColor={resetPassword.formValid ? undefined : '$red8'}
          />
        </XStack>

        <Button
          size="$4"
          theme="blue"
          onPress={() => void resetPassword.handleReset()}
          disabled={resetPassword.isSubmitting || !resetPassword.email.trim()}
          opacity={resetPassword.isSubmitting ? 0.7 : 1}
          icon={Mail}
        >
          {resetPassword.isSubmitting ? t('loading') : t('reset_password.send_link')}
        </Button>

        <Button
          size="$3"
          chromeless
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text color="$blue10" fontSize="$3" fontWeight="700">
            {t('auth.back_to_login')}
          </Text>
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}
