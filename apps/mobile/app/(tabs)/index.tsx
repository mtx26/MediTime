import { useTranslation } from 'react-i18next';
import { YStack, H2, Text } from 'tamagui';
import { useAuth } from '../../src/hooks/auth/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userInfo } = useAuth();

  return (
    <YStack flex={1} padding="$5" backgroundColor="$background" gap="$3">
      <H2 color="$color">
        {t('home.welcome', { name: userInfo?.displayName ?? '' })}
      </H2>
      <Text color="$gray10" fontSize="$4">
        {t('home.subtitle')}
      </Text>
    </YStack>
  );
}
