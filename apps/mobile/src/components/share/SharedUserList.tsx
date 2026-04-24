import { Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedUserListProps } from '@meditime/types';
import { SharedUserRow } from './SharedUserRow';
import { useAppTheme, useIosTheme } from '../../theme/ios';

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
  const { colorScheme } = useAppTheme();
  const canInvite = emailToInvite.trim().length > 0;

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
          <Ionicons name="people-outline" size={18} color={ios.primary} />
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '900' }}>
            {t('shared_users')}
          </Text>
        </XStack>

        <YStack
          style={{
            overflow: 'hidden',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: ios.border,
            backgroundColor: ios.background,
          }}
        >
          {users.map((user, index) => (
            <YStack
              key={user.token}
              style={{
                borderBottomWidth: index === users.length - 1 && invitations.length === 0 ? 0 : 1,
                borderBottomColor: ios.border,
              }}
            >
              <SharedUserRow
                label={user.receiver_name || user.email}
                photoUrl={user.receiver_photo_url}
                status={user.accepted ? String(t('accepted')) : String(t('pending'))}
                onDelete={() => onDeleteUser(user.token)}
              />
            </YStack>
          ))}

          {invitations.map((invitation, index) => (
            <YStack
              key={invitation.token}
              style={{
                borderBottomWidth: index === invitations.length - 1 ? 0 : 1,
                borderBottomColor: ios.border,
              }}
            >
              <SharedUserRow
                label={invitation.invited_email}
                photoUrl={invitation.receiver_photo_url}
                status={String(t('pending'))}
                onDelete={() => onDeleteInvitation(invitation.token)}
              />
            </YStack>
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
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            keyboardAppearance={colorScheme}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (canInvite) {
                onInvite();
              }
            }}
            style={{
              flex: 1,
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: ios.border,
              backgroundColor: ios.background,
              color: ios.foreground,
            }}
          />

          <Pressable onPress={onInvite} disabled={!canInvite} accessibilityRole="button">
            {({ pressed }) => (
              <XStack
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: canInvite ? ios.primary : ios.accentHover,
                  opacity: pressed ? 0.8 : canInvite ? 1 : 0.7,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={canInvite ? ios.primaryForeground : ios.mutedForeground}
                />
              </XStack>
            )}
          </Pressable>
        </XStack>
      </YStack>
    </GlassView>
  );
}
