import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, XStack, YStack } from 'tamagui';
import { AuthPageShell } from '../components/auth';
import { InfoBanner } from '../components/common/InfoBanner';
import { useResetPassword } from '../hooks/auth/useResetPassword';
import { useIosTheme } from '../theme/ios';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();
  const resetPassword = useResetPassword();

  return (
    <AuthPageShell
      iconName="mail-outline"
      title={String(t('reset_password.title'))}
      description={String(t('reset_password.instructions'))}
    >
      <YStack gap="$4">
        {resetPassword.sent && (
          <InfoBanner iconName="checkmark-circle-outline" text={String(t('reset_password.success'))} />
        )}

        {resetPassword.error && (
          <InfoBanner iconName="warning-outline" text={resetPassword.error} tone="warning" />
        )}

        <XStack style={{ alignItems: 'center' }} gap="$2">
          <Ionicons name="mail-outline" size={20} color={ios.mutedForeground} />
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
        >
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="mail-outline" size={18} color={ios.primaryForeground} />
            <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
              {resetPassword.isSubmitting ? t('loading') : t('reset_password.send_link')}
            </Text>
          </XStack>
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
    </AuthPageShell>
  );
}
