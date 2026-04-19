import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { ios } from '../../theme/ios';

type EmptyInfoProps = {
  text: string;
};

export function EmptyInfo({ text }: EmptyInfoProps) {
  return (
    <XStack
      style={{
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: ios.blueInfoBorder,
        backgroundColor: ios.blueInfoBg,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    >
      <Ionicons name="information-circle-outline" size={20} color={ios.blueText} />
      <Text style={{ marginLeft: 8, color: ios.foreground, fontWeight: '700', flex: 1 }}>
        {text}
      </Text>
    </XStack>
  );
}
