import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { GroupedSharedCalendar } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';
import { SharedTokenList } from './SharedTokenList';
import { SharedUserList } from './SharedUserList';

type SharedCalendarPanelProps = {
  calendarId: string;
  data: GroupedSharedCalendar;
  emailToInvite: string;
  onCreateToken: () => void;
  onDeleteInvitation: (token: string) => void;
  onDeleteToken: (tokenId: string) => void;
  onDeleteUser: (token: string) => void;
  onEmailChange: (value: string) => void;
  onInvite: () => void;
  onShareToken: (token: { id: string; token: string; permission: 'read' | 'write' | 'edit' | 'admin'; expires_at: string | null; is_revoked: boolean }) => void;
};

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
        <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 26, fontWeight: '900' }}>
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
