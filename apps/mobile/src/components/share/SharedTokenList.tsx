import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import type { SharedCalendarToken } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type SharedTokenListProps = {
  tokens: SharedCalendarToken[];
  onCreateToken: () => void;
  onDeleteToken: (tokenId: string) => void;
  onShareToken: (token: SharedCalendarToken) => void;
};

export function SharedTokenList({
  tokens,
  onCreateToken,
  onDeleteToken,
  onShareToken,
}: SharedTokenListProps) {
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
        <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
          {t('public_links')}
        </Text>
      </XStack>

      {tokens.length === 0 ? (
        <Button
          onPress={onCreateToken}
          style={{
            minHeight: 42,
            borderRadius: 8,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="add-outline" size={18} color={ios.primary} />
            <Text style={{ color: ios.primary, fontWeight: '900' }}>
              {t('create_share_link')}
            </Text>
          </XStack>
        </Button>
      ) : (
        <YStack style={{ gap: 10 }}>
          {tokens.map((token) => (
            <YStack
              key={token.id}
              style={{
                gap: 10,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: ios.border,
                backgroundColor: ios.background,
              }}
            >
              <Text style={{ color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
                {token.id}
              </Text>
              <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '600' }}>
                {token.expires_at
                  ? `${t('expiration')}: ${new Date(token.expires_at).toLocaleDateString()}`
                  : t('never')}
              </Text>

              <XStack style={{ gap: 10 }}>
                <Pressable onPress={() => onShareToken(token)} accessibilityRole="button">
                  {({ pressed }) => (
                    <XStack
                      style={{
                        minHeight: 38,
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: ios.blueInfoBg,
                        opacity: pressed ? 0.8 : 1,
                      }}
                    >
                      <Ionicons name="share-social-outline" size={16} color={ios.primary} />
                      <Text style={{ color: ios.primary, fontWeight: '800' }}>
                        {t('copy_link')}
                      </Text>
                    </XStack>
                  )}
                </Pressable>

                <Pressable onPress={() => onDeleteToken(token.id)} accessibilityRole="button">
                  {({ pressed }) => (
                    <XStack
                      style={{
                        minHeight: 38,
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: ios.destructiveBg,
                        opacity: pressed ? 0.8 : 1,
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color={ios.destructive} />
                      <Text style={{ color: ios.destructive, fontWeight: '800' }}>
                        {t('delete')}
                      </Text>
                    </XStack>
                  )}
                </Pressable>
              </XStack>
            </YStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
