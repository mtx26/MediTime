import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { YStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type IconButtonProps = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'outline' | 'default';
  disabled?: boolean;
};

export function IconButton({
  label,
  iconName,
  onPress,
  variant = 'outline',
  disabled = false,
}: IconButtonProps) {
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const isDefault = variant === 'default';
  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle={isDefault ? 'regular' : 'clear'}
          tintColor={isDefault ? ios.primary : undefined}
          style={{
            width: isDefault ? 40 : 32,
            height: isDefault ? 40 : 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: isDefault ? 12 : 8,
            opacity: disabled ? 0.6 : pressed ? 0.75 : 1,
          }}
        >
          <Ionicons name={iconName} size={18} color={isDefault ? ios.primaryForeground : ios.primary} />
        </GlassView>
      )}
    </Pressable>
  );
}
