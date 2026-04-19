import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, YStack } from 'tamagui';
import type { SocialProviderButtonProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function SocialProviderButton({
  label,
  iconName,
  color,
  disabled = false,
  onPress,
}: SocialProviderButtonProps<keyof typeof Ionicons.glyphMap>) {
  const ios = useIosTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{ flex: 1, minWidth: 74 }}
    >
      {({ pressed }) => (
        <YStack style={{ alignItems: 'center', gap: 6, opacity: disabled ? 0.55 : pressed ? 0.72 : 1 }}>
          <YStack
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ios.border,
              backgroundColor: ios.card,
            }}
          >
            <Ionicons name={iconName} size={26} color={color} />
          </YStack>
          <Text
            numberOfLines={1}
            style={{
              maxWidth: 80,
              color: ios.mutedForeground,
              fontSize: 11,
              lineHeight: 15,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        </YStack>
      )}
    </Pressable>
  );
}
