import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { PrivacyDataGroupProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function PrivacyDataGroup({
  titleKey,
  itemKeys,
  iconName,
}: PrivacyDataGroupProps<keyof typeof Ionicons.glyphMap>) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 9 }}>
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name={iconName} size={19} color={ios.primary} />
        <Text
          style={{
            flex: 1,
            color: ios.foreground,
            fontSize: 17,
            lineHeight: 23,
            fontWeight: '800',
          }}
        >
          {t(titleKey)}
        </Text>
      </XStack>

      <YStack style={{ gap: 8 }}>
        {itemKeys.map((itemKey) => (
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
    </YStack>
  );
}
