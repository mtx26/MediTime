import { Redirect } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useAuth } from '../src/hooks/auth/useAuth';
import { YStack, Spinner } from 'tamagui';
import { useAppTheme, useIosTheme } from '../src/theme/ios';

export default function Index() {
  const { userInfo, isLoading } = useAuth();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();

  if (isLoading) {
    return (
      <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
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

  if (userInfo) {
    return <Redirect href="/calendars" />;
  }

  return <Redirect href="/(auth)/login" />;
}
