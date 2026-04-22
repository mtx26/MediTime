import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import { AuthPageShell, PasswordInput } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useResetPasswordConfirm } from '../../hooks/auth/useResetPasswordConfirm';
import { useIosTheme } from '../../theme/ios';

export default function ResetPasswordConfirmScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const resetPasswordConfirm = useResetPasswordConfirm();

  if (resetPasswordConfirm.checkingSession) {
    return <LoadingIndicator label={String(t('auth_callback.loading'))} variant="screen" />;
  }

  return (
    <AuthPageShell
      iconName="lock-closed-outline"
      title={String(t('reset_password_confirm.title'))}
      description={String(t('reset_password_confirm.instructions'))}
    >
      <YStack gap="$4">
        {resetPasswordConfirm.success && (
          <InfoBanner iconName="checkmark-circle-outline" text={String(t('reset_password_confirm.success'))} />
        )}

        {resetPasswordConfirm.error && (
          <InfoBanner iconName="warning-outline" text={resetPasswordConfirm.error} tone="warning" />
        )}

        <PasswordInput
          placeholder={String(t('reset_password_confirm.new_password_label'))}
          value={resetPasswordConfirm.password}
          onChangeText={resetPasswordConfirm.setPassword}
          visible={resetPasswordConfirm.showPassword}
          onVisibleChange={resetPasswordConfirm.setShowPassword}
          autoComplete="new-password"
        />

        <Button
          size="$4"
          theme="blue"
          onPress={() => void resetPasswordConfirm.handleSubmit()}
          disabled={
            resetPasswordConfirm.loading ||
            !resetPasswordConfirm.sessionReady ||
            !resetPasswordConfirm.password
          }
          opacity={resetPasswordConfirm.loading ? 0.7 : 1}
        >
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={18} color={ios.primaryForeground} />
            <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
              {resetPasswordConfirm.loading
                ? t('reset_password_confirm.saving')
                : t('reset_password_confirm.save_password')}
            </Text>
          </XStack>
        </Button>
      </YStack>
    </AuthPageShell>
  );
}
