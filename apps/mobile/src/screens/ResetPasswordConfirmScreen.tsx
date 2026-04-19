import { KeyboardAvoidingView, Platform } from 'react-native';
import { Eye, EyeOff, Lock } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { Button, H2, Input, Text, XStack, YStack } from 'tamagui';
import { InfoBanner } from '../components/common/InfoBanner';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { useResetPasswordConfirm } from '../hooks/auth/useResetPasswordConfirm';
import { useIosTheme } from '../theme/ios';

export default function ResetPasswordConfirmScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const resetPasswordConfirm = useResetPasswordConfirm();

  if (resetPasswordConfirm.checkingSession) {
    return <LoadingIndicator label={String(t('auth_callback.loading'))} variant="screen" />;
  }

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
            {t('reset_password_confirm.title')}
          </H2>
          <Text style={{ textAlign: 'center' }} color="$gray10" fontSize="$4">
            {t('reset_password_confirm.instructions')}
          </Text>
        </YStack>

        {resetPasswordConfirm.success && (
          <InfoBanner iconName="checkmark-circle-outline" text={String(t('reset_password_confirm.success'))} />
        )}

        {resetPasswordConfirm.error && (
          <InfoBanner iconName="warning-outline" text={resetPasswordConfirm.error} tone="warning" />
        )}

        <XStack style={{ alignItems: 'center' }} gap="$2">
          <Lock size={20} color="$gray10" />
          <Input
            flex={1}
            size="$4"
            placeholder={t('reset_password_confirm.new_password_label')}
            value={resetPasswordConfirm.password}
            onChangeText={resetPasswordConfirm.setPassword}
            secureTextEntry={!resetPasswordConfirm.showPassword}
            autoComplete="new-password"
          />
          <Button
            size="$3"
            chromeless
            icon={resetPasswordConfirm.showPassword ? EyeOff : Eye}
            onPress={() => resetPasswordConfirm.setShowPassword(!resetPasswordConfirm.showPassword)}
          />
        </XStack>

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
          icon={Lock}
        >
          {resetPasswordConfirm.loading
            ? t('reset_password_confirm.saving')
            : t('reset_password_confirm.save_password')}
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}
