import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { AcceptInviteSummaryProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

export function AcceptInviteSummary({
  invitation,
  loading,
  onAccept,
  onReject,
}: AcceptInviteSummaryProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const ownerName = invitation.owner_display_name || invitation.owner_email;
  const hasOwnerPhoto = Boolean(invitation.owner_photo_url);

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{
        gap: 18,
        padding: 8,
        borderRadius: 24,
      }}
    >
      <YStack style={{ alignItems: 'center', gap: 10 }}>
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
          }}
        >
          <Ionicons name="mail-outline" size={28} color={ios.primary} />
        </GlassView>

        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('invitation.title')}
        </Text>
      </YStack>

      <YStack style={{ gap: 12 }}>
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            flex: 1,
            gap: 10,
            padding: 14,
            borderRadius: 18,
          }}
        >
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '800' }}>
            {t('calendar.label')}
          </Text>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={18} color={ios.primary} />
            <Text style={{ flex: 1, color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
              {invitation.calendar_name}
            </Text>
          </XStack>
        </GlassView>

        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            flex: 1,
            gap: 10,
            padding: 14,
            borderRadius: 18,
          }}
        >
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '800' }}>
            {t('owner')}
          </Text>
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            {hasOwnerPhoto ? (
              <Image
                source={{ uri: invitation.owner_photo_url }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                }}
              />
            ) : (
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                }}
              >
                <Ionicons name="person-outline" size={17} color={ios.primary} />
              </GlassView>
            )}
            <YStack style={{ flex: 1 }}>
              <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                {ownerName}
              </Text>
              <Text numberOfLines={1} style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
                {invitation.owner_email}
              </Text>
            </YStack>
          </XStack>
        </GlassView>
      </YStack>

      <XStack style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            hapticImpact();
            onAccept();
          }}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {({ pressed }) => (
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                minHeight: 46,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                paddingHorizontal: 12,
                opacity: loading ? 0.5 : pressed ? 0.82 : 1,
              }}
            >
              <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="checkmark-outline" size={18} color={ios.primary} />
                <Text style={{ color: ios.primary, fontWeight: '900' }}>
                  {t('accept')}
                </Text>
              </XStack>
            </GlassView>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            hapticImpact();
            onReject();
          }}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {({ pressed }) => (
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                minHeight: 46,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                paddingHorizontal: 12,
                opacity: loading ? 0.5 : pressed ? 0.82 : 1,
              }}
            >
              <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="close-outline" size={18} color={ios.destructive} />
                <Text style={{ color: ios.destructive, fontWeight: '900' }}>
                  {t('reject')}
                </Text>
              </XStack>
            </GlassView>
          )}
        </Pressable>
      </XStack>
    </GlassView>
  );
}
