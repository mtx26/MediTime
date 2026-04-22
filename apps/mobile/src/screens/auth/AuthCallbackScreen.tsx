import { useTranslation } from 'react-i18next';
import { Button, Text, YStack } from 'tamagui';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAuthCallback } from '../../hooks/auth/useAuthCallback';
import { useIosTheme } from '../../theme/ios';

export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const callback = useAuthCallback();

  if (callback.loading) {
    return <LoadingIndicator label={String(t('auth_callback.loading'))} variant="screen" />;
  }

  return (
    <YStack
      flex={1}
      gap="$4"
      style={{
        justifyContent: 'center',
        padding: 20,
        backgroundColor: ios.background,
      }}
    >
      <InfoBanner
        iconName="warning-outline"
        text={callback.error ?? String(t('auth_callback.session_error'))}
        tone="warning"
      />
      {callback.isRecovery && (
        <Button size="$4" theme="blue" onPress={callback.requestNewResetLink}>
          <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
            {t('reset_password_confirm.request_new_link')}
          </Text>
        </Button>
      )}
      <Button size="$4" theme="blue" onPress={callback.backToLogin}>
        <Text style={{ color: ios.primaryForeground, fontWeight: '800' }}>
          {t('auth.back_to_login')}
        </Text>
      </Button>
    </YStack>
  );
}
