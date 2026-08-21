import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import { useAuth } from '../../../src/hooks/auth/useAuth';
import { useIosTheme } from '../../../src/theme/ios';
import { NativeLoadingSpinner } from '../../../src/components/common/NativeLoadingSpinner';

export default function NotificationsLayout() {
  const { t } = useTranslation();
  const { userInfo, isLoading } = useAuth();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <NativeLoadingSpinner size="large" />
      </YStack>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitle: t('notification.label'),
        headerTitleStyle: {
          fontWeight: '700',
          color: ios.foreground,
        },
        headerStyle: {
          backgroundColor: ios.background,
        },
        headerTintColor: ios.primary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: ios.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('notification.label') }} />
    </Stack>
  );
}
