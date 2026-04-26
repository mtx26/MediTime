import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';
import { AuthPageShell, PasswordInput } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LiquidButton } from '../../components/common/LiquidButton';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { MobileForm } from '../../components/common/MobileForm';
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

        <MobileForm
          onSubmit={resetPasswordConfirm.handleSubmit}
          disabled={
            resetPasswordConfirm.loading ||
            !resetPasswordConfirm.sessionReady ||
            !resetPasswordConfirm.password
          }
          gap="$4"
        >
          {(form) => (
            <>
              <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '800' }}>
                {t('reset_password_confirm.new_password_label')} <Text style={{ color: ios.destructive }}>*</Text>
              </Text>
              <PasswordInput
                placeholder={String(t('reset_password_confirm.new_password_label'))}
                value={resetPasswordConfirm.password}
                onChangeText={resetPasswordConfirm.setPassword}
                visible={resetPasswordConfirm.showPassword}
                onVisibleChange={resetPasswordConfirm.setShowPassword}
                autoComplete="new-password"
                onSubmitEditing={form.submit}
                returnKeyType="done"
              />

              <LiquidButton
                iconName="lock-closed-outline"
                label={resetPasswordConfirm.loading
                  ? t('reset_password_confirm.saving')
                  : t('reset_password_confirm.save_password')}
                onPress={form.submit}
                disabled={
                  resetPasswordConfirm.loading ||
                  !resetPasswordConfirm.sessionReady ||
                  !resetPasswordConfirm.password
                }
                loading={resetPasswordConfirm.loading}
              />
            </>
          )}
        </MobileForm>
      </YStack>
    </AuthPageShell>
  );
}
