import { useTranslation } from 'react-i18next';
import { YStack, H2, Button, Text, Separator } from 'tamagui';
import { LogOut } from '@tamagui/lucide-icons';
import { useAuth } from '../../src/hooks/auth/useAuth';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { userInfo, signOut } = useAuth();

  return (
    <YStack flex={1} padding="$5" backgroundColor="$background" gap="$4">
      <H2 color="$color">{t('nav.settings')}</H2>

      <YStack gap="$2" padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
        <Text color="$color" fontWeight="bold">{userInfo?.displayName}</Text>
        <Text color="$gray10">{userInfo?.email}</Text>
      </YStack>

      <Separator />

      <Button
        size="$4"
        theme="red"
        icon={LogOut}
        onPress={signOut}
      >
        {t('auth.logout')}
      </Button>
    </YStack>
  );
}
