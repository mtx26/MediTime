import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { formatDateTime } from '@meditime/utils';
import type { NotificationLineProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type NotificationPresentation = {
  actionLabel: string | null;
  href: string | null;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  message: React.ReactNode;
};

export default function NotificationLine({ notif, onRead }: NotificationLineProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();
  const timestamp = formatDateTime(notif.timestamp, i18n.language);
  const isUnread = !notif.read;

  const strongText = (
    <Text
      style={{
        color: ios.foreground,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '900',
      }}
    />
  );

  const senderText = (
    <Text
      style={{
        color: ios.foreground,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '900',
      }}
    >
      {notif.sender_name ?? t('unknown_user')}
    </Text>
  );

  const presentation = (() : NotificationPresentation | null => {
    switch (notif.notification_type) {
      case 'calendar_invitation':
        return {
          actionLabel: notif.accepted ? String(t('open')) : String(t('accept')),
          href: notif.accepted && notif.calendar_id
            ? `/calendars/shared-user-calendar/${notif.calendar_id}`
            : notif.token
              ? `/accept-invite?token=${encodeURIComponent(notif.token)}&type=login`
              : null,
          iconName: 'person-add-outline',
          iconColor: ios.primary,
          iconBackground: ios.blueInfoBg,
          message: notif.accepted ? (
            <Trans
              i18nKey="notif.calendar_joined"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ) : (
            <Trans
              i18nKey="notif.calendar_invite"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ),
        };
      case 'calendar_invitation_accepted':
        return {
          actionLabel: null,
          href: null,
          iconName: 'checkmark-circle-outline',
          iconColor: ios.success,
          iconBackground: ios.successBg,
          message: (
            <Trans
              i18nKey="notif.invite_accepted"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ),
        };
      case 'calendar_invitation_rejected':
        return {
          actionLabel: null,
          href: null,
          iconName: 'close-circle-outline',
          iconColor: ios.destructive,
          iconBackground: ios.destructiveBg,
          message: (
            <Trans
              i18nKey="notif.invite_rejected"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ),
        };
      case 'calendar_shared_deleted_by_owner':
        return {
          actionLabel: null,
          href: null,
          iconName: 'trash-outline',
          iconColor: ios.destructive,
          iconBackground: ios.destructiveBg,
          message: (
            <Trans
              i18nKey="notif.share_removed_by_owner"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ),
        };
      case 'calendar_shared_deleted_by_receiver':
        return {
          actionLabel: null,
          href: null,
          iconName: 'trash-outline',
          iconColor: ios.destructive,
          iconBackground: ios.destructiveBg,
          message: (
            <Trans
              i18nKey="notif.share_removed_by_you"
              values={{ name: notif.calendar_name ?? '' }}
              components={[senderText, strongText]}
            />
          ),
        };
      case 'low_stock':
        return {
          actionLabel: notif.calendar_id ? String(t('open')) : null,
          href: notif.calendar_id ? `/calendars/calendar/${notif.calendar_id}/stock-alerts` : null,
          iconName: 'warning-outline',
          iconColor: ios.warningText,
          iconBackground: ios.warningBg,
          message: (
            <Trans
              i18nKey="notif.low_stock"
              values={{
                name: notif.medication_name ?? '',
                qty: notif.medication_qty ?? 0,
              }}
              components={[strongText]}
            />
          ),
        };
      default:
        return null;
    }
  })();

  if (!presentation) {
    return null;
  }

  const handlePress = () => {
    if (isUnread) {
      onRead(notif.notification_id);
    }

    if (presentation.href) {
      router.push(presentation.href as never);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={presentation.actionLabel ?? String(t('notification.label'))}
    >
      {({ pressed }) => (
        <XStack
          style={{
            gap: 12,
            padding: 12,
            alignItems: 'flex-start',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isUnread ? ios.blueInfoBorder : ios.border,
            backgroundColor: ios.card,
            opacity: pressed ? 0.88 : 1,
          }}
        >
          <YStack
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              backgroundColor: presentation.iconBackground,
            }}
          >
            <Ionicons
              name={presentation.iconName}
              size={20}
              color={presentation.iconColor}
            />
          </YStack>

          <YStack style={{ flex: 1, gap: 8 }}>
            <Text
              style={{
                color: ios.foreground,
                fontSize: 14,
                lineHeight: 20,
                fontWeight: '500',
              }}
            >
              {presentation.message}
            </Text>

            <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Text
                style={{
                  flex: 1,
                  color: ios.mutedForeground,
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: '600',
                }}
              >
                {timestamp}
              </Text>

              <XStack style={{ alignItems: 'center', gap: 6 }}>
                {isUnread ? (
                  <YStack
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: ios.primary,
                    }}
                  />
                ) : null}
                {presentation.actionLabel || presentation.href ? (
                  <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
                ) : null}
              </XStack>
            </XStack>
          </YStack>
        </XStack>
      )}
    </Pressable>
  );
}
