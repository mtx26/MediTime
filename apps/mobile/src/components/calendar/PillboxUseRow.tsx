import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
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
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.card,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 }}>
        <YStack
          style={{
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={ios.primary} />
        </YStack>
        <YStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
            {weekLabel}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
            {t('prepared_by')}: {preparedBy}
          </Text>
        </YStack>
        <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
      </XStack>

      <Pressable
        disabled={disabled}
        onPress={() => onCancel(use.id)}
        accessibilityRole="button"
        accessibilityLabel={String(t('restore'))}
      >
        {({ pressed }) => (
          <XStack
            style={{
              minHeight: 50,
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: ios.border,
              backgroundColor: pressed ? ios.accentHover : ios.card,
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <Ionicons name="refresh-outline" size={18} color={ios.primary} />
            <Text style={{ flex: 1, color: ios.primary, fontSize: 15, fontWeight: '800' }}>
              {t('restore')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
          </XStack>
        )}
      </Pressable>
    </YStack>
  );
}
