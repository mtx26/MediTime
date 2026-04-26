import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input, Text, XStack, YStack } from 'tamagui';
import { AuthPageShell } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LiquidButton } from '../../components/common/LiquidButton';
import { MobileForm } from '../../components/common/MobileForm';
import { useResetPassword } from '../../hooks/auth/useResetPassword';
import { useIosTheme } from '../../theme/ios';

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

        <MobileForm
          onSubmit={resetPassword.handleReset}
          disabled={resetPassword.isSubmitting || !resetPassword.email.trim()}
          gap="$4"
        >
          {(form) => (
            <>
              <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                {t('auth.email')} <Text style={{ color: ios.destructive }}>*</Text>
              </Text>
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
                  {...form.getInputProps()}
                />
              </XStack>

              <LiquidButton
                iconName="mail-outline"
                label={resetPassword.isSubmitting ? t('loading') : t('reset_password.send_link')}
                onPress={form.submit}
                disabled={resetPassword.isSubmitting || !resetPassword.email.trim()}
                loading={resetPassword.isSubmitting}
              />
            </>
          )}
        </MobileForm>

        <LiquidButton label={t('auth.back_to_login')} onPress={() => router.replace('/(auth)/login')} />
      </YStack>
    </AuthPageShell>
  );
}
