import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { GroupedSharedCalendar } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';
import { SharedUserList } from './SharedUserList';

type SharedCalendarPanelProps = {
  calendarId: string;
  data: GroupedSharedCalendar;
  emailToInvite: string;
  onDeleteInvitation: (token: string) => void;
  onDeleteUser: (token: string) => void;
  onEmailChange: (value: string) => void;
  onInvite: () => void;
};

export function SharedCalendarPanel({
  calendarId,
  data,
  emailToInvite,
  onDeleteInvitation,
  onDeleteUser,
  onEmailChange,
  onInvite,
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
