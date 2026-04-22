import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import { AuthPageShell } from '../../components/auth';
import { InfoBanner } from '../../components/common/InfoBanner';
import { useVerifyEmail } from '../../hooks/auth/useVerifyEmail';
import { useIosTheme } from '../../theme/ios';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
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

        <Button
          size="$4"
          theme="blue"
          onPress={() => void verifyEmail.handleSendVerification()}
          disabled={verifyEmail.isSubmitting || !verifyEmail.email}
          opacity={verifyEmail.isSubmitting ? 0.7 : 1}
        >
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="mail-outline" size={18} color={ios.primaryForeground} />
            <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
              {verifyEmail.isSubmitting ? t('loading') : t('verify_email.resend_link')}
            </Text>
          </XStack>
        </Button>

        {!verifyEmail.email && (
          <Button size="$3" chromeless onPress={verifyEmail.backToLogin}>
            <Text color="$blue10" fontSize="$3" fontWeight="700">
              {t('auth.back_to_login')}
            </Text>
          </Button>
        )}
      </YStack>
    </AuthPageShell>
  );
}
