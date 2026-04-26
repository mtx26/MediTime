import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedTokenListProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';

export function SharedTokenList({
  tokens,
  onCreateToken,
  onDeleteToken,
  onShareToken,
}: SharedTokenListProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const formatExpiration = (value?: string | null) => value
    ? new Date(value).toLocaleDateString()
    : String(t('never'));

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{
        borderRadius: 24,
        padding: 8,
      }}
    >
      <YStack style={{ gap: 12, padding: 6 }}>
        <XStack style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name="link-outline" size={18} color={ios.primary} />
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
            {t('public_links')}
          </Text>
        </XStack>

        {tokens.length === 0 ? (
          <Pressable onPress={onCreateToken} accessibilityRole="button">
            {({ pressed }) => (
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  minHeight: 52,
                  borderRadius: 18,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  opacity: pressed ? 0.75 : 1,
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 10 }}>
                  <Ionicons name="add-outline" size={18} color={ios.primary} />
                  <Text style={{ flex: 1, color: ios.primary, fontSize: 15, fontWeight: '600' }}>
                    {t('create_share_link')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
                </XStack>
              </GlassView>
            )}
          </Pressable>
        ) : (
          <YStack style={{ gap: 8 }}>
            {tokens.map((token) => (
              <Pressable
                key={token.id}
                onPress={() => onShareToken(token)}
                accessibilityRole="button"
              >
              {({ pressed }) => (
                <GlassView
                  colorScheme={colorScheme}
                  glassEffectStyle="clear"
                  style={{
                    minHeight: 58,
                    borderRadius: 18,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    opacity: pressed ? 0.75 : 1,
                  }}
                >
                  <XStack style={{ alignItems: 'center', gap: 12 }}>
                    <GlassView
                      colorScheme={colorScheme}
                      glassEffectStyle="clear"
                      style={{
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 15,
                      }}
                    >
                      <Ionicons name="link-outline" size={16} color={ios.primary} />
                    </GlassView>

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
                        <GlassView
                          colorScheme={colorScheme}
                          glassEffectStyle="clear"
                          style={{
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 18,
                            opacity: deletePressed ? 0.75 : 1,
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color={ios.destructive} />
                        </GlassView>
                      )}
                    </Pressable>

                    <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
                  </XStack>
                </GlassView>
              )}
              </Pressable>
            ))}
          </YStack>
        )}
      </YStack>
    </GlassView>
  );
}
