import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { ios } from '../../../theme/ios';

type ImportTypeOptionProps = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function ImportTypeOption({
  label,
  iconName,
  selected,
  onPress,
}: ImportTypeOptionProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <XStack
          style={{
            minHeight: 44,
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: selected ? ios.blueInfoBg : pressed ? ios.accentHover : ios.background,
            borderWidth: selected ? 1 : 0,
            borderColor: selected ? ios.blueInfoBorder : 'transparent',
          }}
        >
          <Ionicons name={iconName} size={19} color={selected ? ios.primary : ios.mutedForeground} />
          <Text
            style={{
              flex: 1,
              color: selected ? ios.primary : ios.foreground,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            {label}
          </Text>
          {selected && <Ionicons name="checkmark-circle" size={18} color={ios.primary} />}
        </XStack>
      )}
    </Pressable>
  );
}
