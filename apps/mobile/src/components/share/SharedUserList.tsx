import { Image, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedCalendarPendingInvite, SharedCalendarUser } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type SharedUserListProps = {
  emailToInvite: string;
  invitations?: SharedCalendarPendingInvite[];
  users: SharedCalendarUser[];
  onDeleteInvitation: (token: string) => void;
  onDeleteUser: (token: string) => void;
  onEmailChange: (value: string) => void;
  onInvite: () => void;
};

function UserRow({
  label,
  photoUrl,
  status,
  onDelete,
}: {
  label: string;
  photoUrl?: string;
  status: string;
  onDelete: () => void;
}) {
  const ios = useIosTheme();
  const hasPhoto = typeof photoUrl === 'string' && photoUrl.trim().length > 0;

  return (
    <XStack
      style={{
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.background,
      }}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: ios.blueInfoBg,
          }}
        />
      ) : (
        <YStack
          style={{
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 19,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <Ionicons name="person-outline" size={18} color={ios.primary} />
        </YStack>
      )}

      <YStack style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
          {label}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '700' }}>
          {status}
        </Text>
      </YStack>

      <Pressable onPress={onDelete} accessibilityRole="button">
        {({ pressed }) => (
          <XStack
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: ios.destructiveBg,
              opacity: pressed ? 0.8 : 1,
            }}
          >
            <Ionicons name="trash-outline" size={16} color={ios.destructive} />
          </XStack>
        )}
      </Pressable>
    </XStack>
  );
}

export function SharedUserList({
  emailToInvite,
  invitations = [],
  users,
  onDeleteInvitation,
  onDeleteUser,
  onEmailChange,
  onInvite,
}: SharedUserListProps) {
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
        <Ionicons name="people-outline" size={18} color={ios.primary} />
        <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
          {t('shared_users')}
        </Text>
      </XStack>

      <YStack style={{ gap: 10 }}>
        {users.map((user) => (
          <UserRow
            key={user.token}
            label={user.receiver_name || user.email}
            photoUrl={user.receiver_photo_url}
            status={user.accepted ? String(t('accepted')) : String(t('pending'))}
            onDelete={() => onDeleteUser(user.token)}
          />
        ))}

        {invitations.map((invitation) => (
          <UserRow
            key={invitation.token}
            label={invitation.invited_email}
            photoUrl={invitation.receiver_photo_url}
            status={String(t('pending'))}
            onDelete={() => onDeleteInvitation(invitation.token)}
          />
        ))}
      </YStack>

      <XStack
        style={{
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TextInput
          value={emailToInvite}
          onChangeText={onEmailChange}
          placeholder={String(t('recipient_email'))}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            flex: 1,
            minHeight: 42,
            paddingHorizontal: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: ios.border,
            backgroundColor: ios.background,
            color: ios.foreground,
          }}
        />

        <Pressable onPress={onInvite} accessibilityRole="button">
          {({ pressed }) => (
            <XStack
              style={{
                width: 42,
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: ios.primary,
                opacity: pressed ? 0.8 : 1,
              }}
            >
              <Ionicons name="mail-outline" size={18} color={ios.primaryForeground} />
            </XStack>
          )}
        </Pressable>
      </XStack>
    </YStack>
  );
}
