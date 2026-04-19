import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type InfoBannerProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  tone?: 'info' | 'warning';
};

export function InfoBanner({ iconName, text, tone = 'info' }: InfoBannerProps) {
  const ios = useIosTheme();
  const isInfo = tone === 'info';

  return (
    <XStack
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: isInfo ? ios.blueInfoBg : ios.warningBg,
      }}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={isInfo ? ios.blueText : ios.warningText}
      />
      <Text
        style={{
          flex: 1,
          color: ios.foreground,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </XStack>
  );
}
