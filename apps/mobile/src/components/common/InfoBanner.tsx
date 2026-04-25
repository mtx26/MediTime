import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type InfoBannerProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  tone?: 'info' | 'warning';
};

export function InfoBanner({ iconName, text, tone = 'info' }: InfoBannerProps) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const isInfo = tone === 'info';

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{
        borderRadius: 18,
        padding: 12,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 10 }}>
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
            fontWeight: '500',
          }}
        >
          {text}
        </Text>
      </XStack>
    </GlassView>
  );
}
