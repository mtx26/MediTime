import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/auth/useAuth';

export default function AuthLayout() {
  const { userInfo } = useAuth();

  if (userInfo) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
