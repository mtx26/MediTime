import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { TermsSectionProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function TermsSection({
  titleKey,
  paragraphs = [],
  list = [],
  conclusionKey,
}: TermsSectionProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack
      style={{
        gap: 12,
        paddingBottom: 22,
        borderBottomWidth: 1,
        borderBottomColor: ios.border,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name="document-text-outline" size={19} color={ios.primary} />
        <Text
          style={{
            flex: 1,
            color: ios.foreground,
            fontSize: 20,
            lineHeight: 26,
            fontWeight: '800',
          }}
        >
          {t(titleKey)}
        </Text>
      </XStack>

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
