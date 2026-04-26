import { useTranslation } from 'react-i18next';
import { Text, YStack } from 'tamagui';
import { AuthPageShell } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LiquidButton } from '../../components/common/LiquidButton';
import { useVerifyEmail } from '../../hooks/auth/useVerifyEmail';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const verifyEmail = useVerifyEmail();

  return (
    <AuthPageShell
      iconName="mail-unread-outline"
      title={String(t('verify_email.title'))}
      description={String(t('verify_email.instructions'))}
    >
      <YStack gap="$4">
        {verifyEmail.email && (
          <Text style={{ textAlign: 'center' }} color="$gray10" fontSize="$3" fontWeight="700">
            {verifyEmail.email}
          </Text>
        )}

        {verifyEmail.sent && (
          <InfoBanner iconName="checkmark-circle-outline" text={String(t('auth.verification_sent'))} />
        )}

        {verifyEmail.error && (
          <InfoBanner iconName="warning-outline" text={verifyEmail.error} tone="warning" />
        )}

        <LiquidButton
          iconName="mail-outline"
          label={verifyEmail.isSubmitting ? t('loading') : t('verify_email.resend_link')}
          onPress={() => void verifyEmail.handleSendVerification()}
          disabled={verifyEmail.isSubmitting || !verifyEmail.email}
          loading={verifyEmail.isSubmitting}
        />

        {!verifyEmail.email && (
          <LiquidButton label={t('auth.back_to_login')} onPress={verifyEmail.backToLogin} />
        )}
      </YStack>
    </AuthPageShell>
  );
}
