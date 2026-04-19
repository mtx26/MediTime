import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { ios } from '../../theme/ios';

type StatusBadgeProps = {
  text: string;
};

export function StatusBadge({ text }: StatusBadgeProps) {
  return (
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
      }}
    >
      <Ionicons name="warning-outline" size={15} color={ios.warningText} />
      <Text style={{ color: ios.warningText, fontSize: 13, fontWeight: '700' }}>
        {text}
      </Text>
    </XStack>
  );
}
