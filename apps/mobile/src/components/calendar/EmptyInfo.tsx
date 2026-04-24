import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { GlassSurface } from '../common/GlassSurface';
import { useIosTheme } from '../../theme/ios';

type EmptyInfoProps = {
  text: string;
};

export function EmptyInfo({ text }: EmptyInfoProps) {
  const ios = useIosTheme();

  return (
    <GlassSurface
      tintColor={ios.blueInfoBg}
      style={{
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderColor: ios.blueInfoBorder,
        gap: 8,
      }}
    >
      <Ionicons name="information-circle-outline" size={20} color={ios.blueText} />
      <Text style={{ flex: 1, color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '500' }}>
        {text}
      </Text>
    </GlassSurface>
  );
}
