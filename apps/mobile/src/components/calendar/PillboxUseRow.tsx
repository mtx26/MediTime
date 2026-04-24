import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import type { PillboxUseRowProps } from '@meditime/types';
import { GlassSurface } from '../common/GlassSurface';
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
    <GlassSurface
      glassEffectStyle="clear"
      style={{
        borderRadius: 24,
        padding: 8,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingVertical: 6 }}>
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
        <Pressable
          disabled={disabled}
          onPress={() => onCancel(use.id)}
          accessibilityRole="button"
          accessibilityLabel={String(t('restore'))}
        >
          {({ pressed }) => (
            <XStack
              style={{
                minHeight: 38,
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: pressed ? ios.accentHover : 'transparent',
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <Ionicons name="refresh-outline" size={17} color={ios.primary} />
              <Text style={{ color: ios.primary, fontSize: 14, fontWeight: '800' }}>
                {t('restore')}
              </Text>
            </XStack>
          )}
        </Pressable>
      </XStack>
    </GlassSurface>
  );
}
