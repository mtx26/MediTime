import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/auth/useAuth';
import { YStack, Spinner } from 'tamagui';
import { useIosTheme } from '../src/theme/ios';

export default function Index() {
  const { userInfo, isLoading } = useAuth();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  if (userInfo) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
