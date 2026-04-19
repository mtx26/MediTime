import { useTranslation } from 'react-i18next';
import { Input, XStack, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import { IconButton } from '../common/IconButton';
import { useIosTheme } from '../../theme/ios';

type RenameFormProps = {
  calendar: CalendarItem;
  value: string;
  disabled: boolean;
  onChange: (calendarId: string, value: string) => void;
  onSubmit: (calendar: CalendarItem) => void;
  onCancel: () => void;
};

export function RenameForm({
  calendar,
  value,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}: RenameFormProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack
      style={{
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: ios.border,
      }}
    >
      <XStack style={{ gap: 8, width: '100%', alignItems: 'center' }}>
        <Input
          id={`renameCalendarName${calendar.id}`}
          aria-label={t('calendar.new_name')}
          value={value}
          disabled={disabled}
          onChangeText={(next) => onChange(calendar.id, next)}
          placeholder={t('calendar.new_name')}
          returnKeyType="done"
          onSubmitEditing={() => onSubmit(calendar)}
          style={{
            flex: 1,
            minHeight: 44,
            borderWidth: 0,
            borderRadius: 12,
            backgroundColor: ios.background,
            color: ios.foreground,
            fontSize: 16,
          }}
        />
        <IconButton
          label={t('rename')}
          iconName="pencil-outline"
          variant="default"
          disabled={disabled}
          onPress={() => onSubmit(calendar)}
        />
        <IconButton
          label={t('cancel')}
          iconName="close-outline"
          disabled={disabled}
          onPress={onCancel}
        />
      </XStack>
    </YStack>
  );
}
