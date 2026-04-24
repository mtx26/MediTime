import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { useIosTheme } from '../../../theme/ios';

type ImportTypeOptionProps = {
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ImportTypeOption({
  description,
  label,
  iconName,
  selected,
  onPress,
}: ImportTypeOptionProps) {
  const ios = useIosTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      {({ pressed }) => (
        <XStack
          style={{
            alignItems: 'flex-start',
            gap: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: selected ? ios.primary : ios.border,
            backgroundColor: selected ? ios.blueInfoBg : pressed ? ios.accentHover : ios.background,
            opacity: pressed ? 0.86 : 1,
          }}
        >
          <Ionicons
            name={selected ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={selected ? ios.primary : ios.mutedForeground}
          />
          <YStack style={{ flex: 1, gap: 4 }}>
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name={iconName} size={18} color={selected ? ios.primary : ios.mutedForeground} />
              <Text
                style={{
                  flex: 1,
                  color: ios.foreground,
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: '800',
                }}
              >
                {label}
              </Text>
            </XStack>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {description}
            </Text>
          </YStack>
        </XStack>
      )}
    </Pressable>
  );
}
