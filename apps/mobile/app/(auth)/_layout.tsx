import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '../../src/hooks/auth/useAuth';

export default function AuthLayout() {
  const { userInfo } = useAuth();
  const pathname = usePathname();
  const isPasswordConfirmRoute = pathname.endsWith('/reset-password-confirm');

  if (userInfo && !isPasswordConfirmRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
