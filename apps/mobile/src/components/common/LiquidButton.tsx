import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Spinner, Text, XStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type LiquidButtonProps = {
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: ReactNode;
  loading?: boolean;
  onPress: () => void;
  tone?: 'primary' | 'success' | 'plain';
};

export function LiquidButton({
  disabled = false,
  iconName,
  label,
  loading = false,
  onPress,
  tone = 'plain',
}: LiquidButtonProps) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const contentColor = tone === 'success' ? ios.success : ios.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          }}
        >
          <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <Spinner size="small" color={contentColor} />
            ) : iconName ? (
              <Ionicons name={iconName} size={18} color={contentColor} />
            ) : null}
            <Text style={{ color: contentColor, fontSize: 16, fontWeight: '900' }}>
              {label}
            </Text>
          </XStack>
        </GlassView>
      )}
    </Pressable>
  );
}
