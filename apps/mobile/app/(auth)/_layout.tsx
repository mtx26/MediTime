import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '../../src/hooks/auth/useAuth';

export default function AuthLayout() {
  const { userInfo } = useAuth();
  const pathname = usePathname();
  const isAuthenticatedAuthRoute =
    pathname.endsWith('/reset-password-confirm') ||
    pathname.endsWith('/verify-email');

  if (userInfo && !isAuthenticatedAuthRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
