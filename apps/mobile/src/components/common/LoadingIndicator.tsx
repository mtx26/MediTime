import { GlassView } from 'expo-glass-effect';
import { Spinner, Text, XStack, YStack } from 'tamagui';
import type { LoadingIndicatorProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';

export function LoadingIndicator({
  label,
  variant = 'inline',
}: LoadingIndicatorProps) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();

  if (variant === 'screen') {
    return (
      <YStack
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          backgroundColor: ios.background,
        }}
      >
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minWidth: 118,
            borderRadius: 24,
            padding: 16,
          }}
        >
          <Spinner size="large" color={ios.primary} />
          <Text style={{ color: ios.mutedForeground, fontWeight: '700', textAlign: 'center' }}>
            {label}
          </Text>
        </GlassView>
      </YStack>
    );
  }

  return (
    <XStack
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
      }}
    >
      <Spinner size="small" color={ios.primary} />
      <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
    </XStack>
  );
}
