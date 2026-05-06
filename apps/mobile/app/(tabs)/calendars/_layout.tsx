import { Redirect, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Spinner, YStack } from 'tamagui';
import { useAuth } from '../../../src/hooks/auth/useAuth';
import { useIosTheme } from '../../../src/theme/ios';

export default function CalendarsLayout() {
  const { t } = useTranslation();
  const { userInfo, isLoading } = useAuth();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <Spinner size="large" color={ios.primary} />
      </YStack>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitle: t('calendars'),
        headerTitleStyle: {
          fontWeight: '700',
          color: ios.foreground,
        },
        headerStyle: {
          backgroundColor: ios.background,
        },
        headerTintColor: ios.primary,
        headerShadowVisible: false,
        orientation: 'portrait',
        contentStyle: {
          backgroundColor: ios.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('calendars') }} />
      <Stack.Screen name="calendar/[calendarId]" />
      <Stack.Screen name="calendar/[calendarId]/daily" />
      <Stack.Screen name="calendar/[calendarId]/ics-tokens" />
      <Stack.Screen name="calendar/[calendarId]/pillbox-uses" />
      <Stack.Screen name="calendar/[calendarId]/stock-alerts" />
      <Stack.Screen name="calendar/[calendarId]/settings" />
      <Stack.Screen name="calendar/[calendarId]/pillbox" options={{ presentation: 'fullScreenModal', headerShown: false, orientation: 'landscape', contentStyle: { backgroundColor: ios.background } }} />
      <Stack.Screen name="calendar/[calendarId]/edit-box" options={{ presentation: 'formSheet', headerShown: true, sheetExpandsWhenScrolledToEdge: false }} />
      <Stack.Screen name="calendar/[calendarId]/missed-intakes/index" />
      <Stack.Screen name="calendar/[calendarId]/missed-intakes/recap" />
      <Stack.Screen name="shared-user-calendar/[calendarId]" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/daily" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/ics-tokens" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/pillbox-uses" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/stock-alerts" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/settings" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/pillbox" options={{ presentation: 'fullScreenModal', headerShown: false, orientation: 'landscape', contentStyle: { backgroundColor: ios.background } }} />
      <Stack.Screen name="shared-user-calendar/[calendarId]/edit-box" options={{ presentation: 'formSheet', headerShown: true, sheetExpandsWhenScrolledToEdge: false }} />
      <Stack.Screen name="shared-user-calendar/[calendarId]/missed-intakes/index" />
      <Stack.Screen name="shared-user-calendar/[calendarId]/missed-intakes/recap" />
    </Stack>
  );
}
