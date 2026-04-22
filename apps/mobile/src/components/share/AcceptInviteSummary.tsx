import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import type { AcceptInviteSummaryProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function AcceptInviteSummary({
  invitation,
  loading,
  onAccept,
  onReject,
}: AcceptInviteSummaryProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const ownerName = invitation.owner_display_name || invitation.owner_email;
  const hasOwnerPhoto = Boolean(invitation.owner_photo_url);

  return (
    <YStack
      style={{
        gap: 18,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.card,
      }}
    >
      <YStack style={{ alignItems: 'center', gap: 10 }}>
        <YStack
          style={{
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <Ionicons name="mail-outline" size={28} color={ios.primary} />
        </YStack>

        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('invitation.title')}
        </Text>
      </YStack>

      <YStack style={{ gap: 12 }}>
        <YStack
          style={{
            flex: 1,
            gap: 10,
            padding: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: ios.border,
            backgroundColor: ios.background,
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
        </YStack>

        <YStack
          style={{
            flex: 1,
            gap: 10,
            padding: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: ios.border,
            backgroundColor: ios.background,
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
                  backgroundColor: ios.blueInfoBg,
                }}
              />
            ) : (
              <YStack
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: ios.blueInfoBg,
                }}
              >
                <Ionicons name="person-outline" size={17} color={ios.primary} />
              </YStack>
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
        </YStack>
      </YStack>

      <XStack style={{ gap: 10 }}>
        <Button
          flex={1}
          onPress={onAccept}
          disabled={loading}
          style={{
            minHeight: 46,
            borderRadius: 8,
            backgroundColor: ios.primary,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="checkmark-outline" size={18} color={ios.primaryForeground} />
            <Text style={{ color: ios.primaryForeground, fontWeight: '900' }}>
              {t('accept')}
            </Text>
          </XStack>
        </Button>

        <Button
          flex={1}
          onPress={onReject}
          disabled={loading}
          style={{
            minHeight: 46,
            borderRadius: 8,
            backgroundColor: ios.destructiveBg,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="close-outline" size={18} color={ios.destructive} />
            <Text style={{ color: ios.destructive, fontWeight: '900' }}>
              {t('reject')}
            </Text>
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}
