import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedTokenListProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function SharedTokenList({
  tokens,
  onCreateToken,
  onDeleteToken,
  onShareToken,
}: SharedTokenListProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const formatExpiration = (value?: string | null) => value
    ? new Date(value).toLocaleDateString()
    : String(t('never'));

  return (
    <YStack
      style={{
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.card,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name="link-outline" size={18} color={ios.primary} />
        <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
          {t('public_links')}
        </Text>
      </XStack>

      {tokens.length === 0 ? (
        <Pressable onPress={onCreateToken} accessibilityRole="button">
          {({ pressed }) => (
            <XStack
              style={{
                minHeight: 52,
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: ios.border,
                backgroundColor: pressed ? ios.accentHover : ios.background,
              }}
            >
              <Ionicons name="add-outline" size={18} color={ios.primary} />
              <Text style={{ flex: 1, color: ios.primary, fontSize: 15, fontWeight: '600' }}>
                {t('create_share_link')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
            </XStack>
          )}
        </Pressable>
      ) : (
        <YStack
          style={{
            overflow: 'hidden',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: ios.border,
            backgroundColor: ios.background,
          }}
        >
          {tokens.map((token, index) => (
            <Pressable
              key={token.id}
              onPress={() => onShareToken(token)}
              accessibilityRole="button"
            >
              {({ pressed }) => (
                <XStack
                  style={{
                    minHeight: 58,
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: index === tokens.length - 1 ? 0 : 1,
                    borderBottomColor: ios.border,
                    backgroundColor: pressed ? ios.accentHover : ios.background,
                  }}
                >
                  <YStack
                    style={{
                      width: 30,
                      height: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      backgroundColor: ios.card,
                    }}
                  >
                    <Ionicons name="link-outline" size={16} color={ios.primary} />
                  </YStack>

                  <YStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
                      {t('copy_link')}
                    </Text>
                    <Text numberOfLines={1} style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
                      {`${t('expiration')}: ${formatExpiration(token.expires_at)}`}
                    </Text>
                  </YStack>

                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      onDeleteToken(token.id);
                    }}
                    accessibilityRole="button"
                  >
                    {({ pressed: deletePressed }) => (
                      <XStack
                        style={{
                          width: 40,
                          height: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          backgroundColor: deletePressed ? ios.destructiveBg : 'transparent',
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={ios.destructive} />
                      </XStack>
                    )}
                  </Pressable>

                  <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
                </XStack>
              )}
            </Pressable>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
