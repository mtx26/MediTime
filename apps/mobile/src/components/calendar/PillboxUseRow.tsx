import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import type { PillboxUseRowProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function PillboxUseRow({
  use,
  weekLabel,
  disabled = false,
  onCancel,
}: PillboxUseRowProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const preparedBy = use.prepared_by.display_name || use.prepared_by.email || '-';

  return (
    <YStack
      style={{
        gap: 12,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.card,
      }}
    >
      <XStack style={{ alignItems: 'flex-start', gap: 10 }}>
        <YStack
          style={{
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={ios.primary} />
        </YStack>
        <YStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
            {weekLabel}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
            {t('prepared_by')}: {preparedBy}
          </Text>
        </YStack>
      </XStack>

      <Button
        size="$3"
        disabled={disabled}
        onPress={() => onCancel(use.id)}
        style={{
          minHeight: 42,
          borderRadius: 12,
          backgroundColor: ios.blueInfoBg,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="refresh-outline" size={17} color={ios.primary} />
          <Text style={{ color: ios.primary, fontWeight: '900' }}>
            {t('restore')}
          </Text>
        </XStack>
      </Button>
    </YStack>
  );
}
