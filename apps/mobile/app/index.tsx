import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/auth/useAuth';
import { YStack, Spinner } from 'tamagui';

export default function Index() {
  const { userInfo, isLoading } = useAuth();

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  if (userInfo) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
