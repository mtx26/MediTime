import { Text, XStack, YStack } from 'tamagui';
import type { LoadingIndicatorProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';
import { NativeLoadingSpinner } from './NativeLoadingSpinner';

export function LoadingIndicator({
  label,
  variant = 'inline',
}: LoadingIndicatorProps) {
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
        <NativeLoadingSpinner size="large" />
        <Text style={{ color: ios.mutedForeground, fontWeight: '700', textAlign: 'center' }}>
          {label}
        </Text>
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
      <NativeLoadingSpinner size="small" />
      <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
    </XStack>
  );
}
