import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, YStack } from 'tamagui';
import type { SocialProviderButtonProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

export function SocialProviderButton({
  label,
  iconName,
  color,
  disabled = false,
  onPress,
}: SocialProviderButtonProps<keyof typeof Ionicons.glyphMap>) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const handlePress = () => {
    hapticImpact();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      style={{ flex: 1, minWidth: 74 }}
    >
      {({ pressed }) => (
        <YStack style={{ alignItems: 'center', gap: 6, opacity: disabled ? 0.55 : pressed ? 0.72 : 1 }}>
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
            }}
          >
            <Ionicons name={iconName} size={26} color={color} />
          </GlassView>
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
