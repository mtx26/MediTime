import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { ios } from '../../theme/ios';

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
  const isDefault = variant === 'default';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <YStack
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: isDefault ? ios.primary : '#e8f3ff',
            opacity: disabled ? 0.6 : pressed ? 0.75 : 1,
          }}
        >
          <Ionicons name={iconName} size={18} color={isDefault ? ios.card : ios.primary} />
        </YStack>
      )}
    </Pressable>
  );
}
