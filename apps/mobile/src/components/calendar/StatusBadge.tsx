import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type StatusBadgeProps = {
  onPress?: () => void;
  text: string;
};

export function StatusBadge({ onPress, text }: StatusBadgeProps) {
  const ios = useIosTheme();
  const content = ({ pressed = false }: { pressed?: boolean } = {}) => (
    <XStack
      style={{
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: ios.warningBg,
        opacity: pressed ? 0.7 : 1,
      }}
    >
      <Ionicons name="warning-outline" size={15} color={ios.warningText} />
      <Text style={{ color: ios.warningText, fontSize: 13, fontWeight: '700' }}>
        {text}
      </Text>
    </XStack>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        {({ pressed }) => content({ pressed })}
      </Pressable>
    );
  }

  return content();
}
