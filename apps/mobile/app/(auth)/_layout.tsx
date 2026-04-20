import { Redirect, Stack, type Href, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../src/components/common/BackButton';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { useIosTheme } from '../../src/theme/ios';

export default function AuthLayout() {
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const ios = useIosTheme();
  const isAuthenticatedAuthRoute =
    pathname.endsWith('/reset-password-confirm') ||
    pathname.endsWith('/verify-email');

  if (userInfo && !isAuthenticatedAuthRoute) {
    return <Redirect href="/calendars" />;
  }

  const isolatedAuthHeader = (title: string, fallbackHref: Href = '/(auth)/login') => ({
    title,
    headerShown: true,
    headerLeft: () => <BackButton fallbackHref={fallbackHref} variant="header" />,
  });

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="reset-password"
        options={isolatedAuthHeader(t('reset_password.title'))}
      />
      <Stack.Screen
        name="reset-password-confirm"
        options={isolatedAuthHeader(t('reset_password_confirm.title'))}
      />
      <Stack.Screen
        name="verify-email"
        options={isolatedAuthHeader(t('verify_email.title'))}
      />
    </Stack>
  );
}
