import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedCalendarPanelProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';
import { SharedTokenList } from './SharedTokenList';
import { SharedUserList } from './SharedUserList';

export function SharedCalendarPanel({
  calendarId,
  data,
  emailToInvite,
  onCreateToken,
  onDeleteInvitation,
  onDeleteToken,
  onDeleteUser,
  onEmailChange,
  onInvite,
  onShareToken,
}: SharedCalendarPanelProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 14 }}>
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name="people-outline" size={20} color={ios.primary} />
        <Text style={{ color: ios.foreground, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>
          {t('shared_calendar', { name: data.calendar_name || calendarId })}
        </Text>
      </XStack>

      <SharedTokenList
        tokens={data.tokens ?? []}
        onCreateToken={onCreateToken}
        onDeleteToken={onDeleteToken}
        onShareToken={onShareToken}
      />

      <SharedUserList
        emailToInvite={emailToInvite}
        invitations={data.invitation}
        users={data.users ?? []}
        onDeleteInvitation={onDeleteInvitation}
        onDeleteUser={onDeleteUser}
        onEmailChange={onEmailChange}
        onInvite={onInvite}
      />
    </YStack>
  );
}
