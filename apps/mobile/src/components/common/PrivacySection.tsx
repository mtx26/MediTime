import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { PrivacySectionProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function PrivacySection({
  titleKey,
  paragraphs = [],
  list = [],
  conclusionKey,
  highlightKey,
  withDivider = true,
}: PrivacySectionProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack
      style={{
        gap: 12,
        paddingBottom: 22,
        borderBottomWidth: withDivider ? 1 : 0,
        borderBottomColor: ios.border,
      }}
    >
      <Text
        style={{
          color: ios.foreground,
          fontSize: 20,
          lineHeight: 26,
          fontWeight: '800',
        }}
      >
        {t(titleKey)}
      </Text>

      {paragraphs.map((paragraphKey) => (
        <Text
          key={paragraphKey}
          style={{
            color: ios.mutedForeground,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {t(paragraphKey)}
        </Text>
      ))}

      {list.length > 0 && (
        <YStack style={{ gap: 8 }}>
          {list.map((itemKey) => (
            <XStack key={itemKey} style={{ gap: 8, alignItems: 'flex-start' }}>
              <Text style={{ color: ios.primary, fontSize: 16, lineHeight: 22 }}>{'\u2022'}</Text>
              <Text
                style={{
                  flex: 1,
                  color: ios.mutedForeground,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {t(itemKey)}
              </Text>
            </XStack>
          ))}
        </YStack>
      )}

      {highlightKey && (
        <Text
          style={{
            color: ios.foreground,
            fontSize: 15,
            lineHeight: 22,
            fontWeight: '800',
          }}
        >
          {t(highlightKey)}
        </Text>
      )}

      {conclusionKey && (
        <Text
          style={{
            color: ios.mutedForeground,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {t(conclusionKey)}
        </Text>
      )}
    </YStack>
  );
}
