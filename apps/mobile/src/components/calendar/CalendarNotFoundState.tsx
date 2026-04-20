import { Text, YStack } from 'tamagui';
import { useTranslation } from 'react-i18next';
import type { CalendarNotFoundStateProps } from '@meditime/types';
import { OutlineButton } from '../common/OutlineButton';
import { useIosTheme } from '../../theme/ios';

export function CalendarNotFoundState({ onBackToCalendars }: CalendarNotFoundStateProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack
      style={{
        flex: 1,
        justifyContent: 'center',
        gap: 14,
        padding: 18,
        backgroundColor: ios.background,
      }}
    >
      <YStack
        style={{
          gap: 10,
          padding: 16,
          borderRadius: 8,
          backgroundColor: ios.card,
          borderWidth: 1,
          borderColor: ios.border,
        }}
      >
        <Text style={{ color: ios.foreground, fontSize: 20, fontWeight: '900' }}>{t('api.ics.calendar_not_found')}</Text>
        <Text style={{ color: ios.mutedForeground, lineHeight: 20 }}>{t('invalid_or_expired_link')}</Text>
        <OutlineButton label={String(t('calendars'))} onPress={onBackToCalendars} />
      </YStack>
    </YStack>
  );
}
