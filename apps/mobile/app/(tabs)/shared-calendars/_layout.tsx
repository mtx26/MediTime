import { Redirect, Stack } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Spinner, YStack } from 'tamagui';
import { useAuth } from '../../../src/hooks/auth/useAuth';
import { useAppTheme, useIosTheme } from '../../../src/theme/ios';

export default function SharedCalendarsLayout() {
  const { t } = useTranslation();
  const { userInfo, isLoading } = useAuth();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            width: 82,
            height: 82,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 24,
          }}
        >
          <Spinner size="large" color={ios.primary} />
        </GlassView>
      </YStack>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitle: t('shared_calendars'),
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
      <Stack.Screen name="index" options={{ title: t('shared_calendars') }} />
    </Stack>
  );
}
