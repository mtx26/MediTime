import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Spinner, Text, XStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

type LiquidButtonProps = {
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: ReactNode;
  loading?: boolean;
  onPress: () => void;
  size?: 'default' | 'sm';
  tone?: 'primary' | 'success' | 'plain';
};

export function LiquidButton({
  disabled = false,
  iconName,
  label,
  loading = false,
  onPress,
  size = 'default',
  tone = 'plain',
}: LiquidButtonProps) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const contentColor = tone === 'success' ? ios.success : ios.primary;
  const isSmall = size === 'sm';
  const handlePress = () => {
    hapticImpact();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
    >
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            minHeight: isSmall ? 36 : 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: isSmall ? 14 : 18,
            paddingHorizontal: isSmall ? 12 : 16,
            paddingVertical: isSmall ? 7 : 10,
            opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          }}
        >
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: isSmall ? 6 : 8 }}>
            {loading ? (
              <Spinner size="small" color={contentColor} />
            ) : iconName ? (
              <Ionicons name={iconName} size={isSmall ? 15 : 18} color={contentColor} />
            ) : null}
            <Text style={{ color: contentColor, fontSize: isSmall ? 13 : 16, fontWeight: '900' }}>
              {label}
            </Text>
          </XStack>
        </GlassView>
      )}
    </Pressable>
  );
}
