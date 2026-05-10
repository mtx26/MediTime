import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/auth/useAuth';
import { YStack } from 'tamagui';
import { useIosTheme } from '../src/theme/ios';
import { NativeLoadingSpinner } from '../src/components/common/NativeLoadingSpinner';

export default function Index() {
  const { userInfo, isLoading } = useAuth();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <NativeLoadingSpinner size="large" />
      </YStack>
    );
  }

  if (userInfo) {
    return <Redirect href="/calendars" />;
  }

  return <Redirect href="/(auth)/login" />;
}
