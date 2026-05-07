import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedUserListProps } from '@meditime/types';
import { SharedUserRow } from './SharedUserRow';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

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

        <YStack style={{ gap: 8 }}>
          {users.map((user) => (
            <YStack key={user.token}>
              <SharedUserRow
                label={user.receiver_name || user.email}
                photoUrl={user.receiver_photo_url}
                status={user.accepted ? String(t('accepted')) : String(t('pending'))}
                onDelete={() => onDeleteUser(user.token)}
              />
            </YStack>
          ))}

          {invitations.map((invitation) => (
            <YStack key={invitation.token}>
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
          <View
            style={{
              flex: 1,
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: 18,
              paddingHorizontal: 12,
              backgroundColor: ios.card,
            }}
          >
            <TextInput
              value={emailToInvite}
              onChangeText={onEmailChange}
              placeholder={String(t('recipient_email'))}
              placeholderTextColor={ios.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardAppearance={colorScheme}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (canInvite) {
                  hapticImpact();
                  onInvite();
                }
                }}
              style={{
                minHeight: 44,
                color: ios.foreground,
              }}
            />
          </View>

          <Pressable
            onPress={() => {
              hapticImpact();
              onInvite();
            }}
            disabled={!canInvite}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  backgroundColor: canInvite ? ios.primary : ios.accentHover,
                  opacity: pressed ? 0.8 : 1,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={canInvite ? ios.primaryForeground : ios.mutedForeground}
                />
              </View>
            )}
          </Pressable>
        </XStack>
      </YStack>
    </GlassView>
  );
}
