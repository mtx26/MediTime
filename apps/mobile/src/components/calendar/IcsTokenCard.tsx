import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import type { IcsTokenCardProps } from '@meditime/types';
import { IconButton } from '../common/IconButton';
import { useIosTheme } from '../../theme/ios';

export function IcsTokenCard({
  token,
  webcalUrl,
  disabled = false,
  onDelete,
  onShare,
  onSubscribe,
}: IcsTokenCardProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

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
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name="link-outline" size={18} color={ios.primary} />
        <Text style={{ flex: 1, color: ios.foreground, fontSize: 16, fontWeight: '900' }}>
          {t('ics.token_label')}
        </Text>
      </XStack>

      <Pressable
        onPress={() => onShare(webcalUrl)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={String(t('copy_link'))}
      >
        {({ pressed }) => (
          <YStack
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: pressed ? ios.accentHover : ios.background,
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <Text numberOfLines={2} style={{ color: ios.foreground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
              {webcalUrl}
            </Text>
          </YStack>
        )}
      </Pressable>

      <Button
        size="$4"
        disabled={disabled}
        onPress={() => onSubscribe(webcalUrl)}
        style={{
          minHeight: 46,
          borderRadius: 12,
          backgroundColor: ios.primary,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="calendar-outline" size={18} color={ios.primaryForeground} />
          <Text style={{ color: ios.primaryForeground, fontSize: 15, fontWeight: '900' }}>
            {t('ics.sync_calendar')}
          </Text>
        </XStack>
      </Button>

      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
            {t('creator')}
          </Text>
          <Text numberOfLines={1} style={{ color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
            {token.owner_display_name || token.owner_email || '-'}
          </Text>
        </YStack>
        <XStack style={{ gap: 8 }}>
          <IconButton
            label={String(t('copy_link'))}
            iconName="share-outline"
            disabled={disabled}
            onPress={() => onShare(webcalUrl)}
          />
          <IconButton
            label={String(t('delete'))}
            iconName="trash-outline"
            disabled={disabled}
            onPress={() => onDelete(token)}
          />
        </XStack>
      </XStack>
    </YStack>
  );
}
