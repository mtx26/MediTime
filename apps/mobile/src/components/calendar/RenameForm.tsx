import { useTranslation } from 'react-i18next';
import { Input, XStack, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import { IconButton } from '../common/IconButton';
import { MobileForm } from '../common/MobileForm';
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
  const canSubmit = Boolean(value.trim());

  return (
    <MobileForm
      onSubmit={() => onSubmit(calendar)}
      disabled={disabled || !canSubmit}
    >
      {(form) => (
        <XStack style={{ flex: 1, gap: 8, width: '100%', alignItems: 'center' }}>
          <Input
            id={`renameCalendarName${calendar.id}`}
            aria-label={t('calendar.new_name')}
            aria-required
            value={value}
            disabled={disabled}
            autoFocus
            onChangeText={(next) => onChange(calendar.id, next)}
            placeholder={t('calendar.new_name')}
            {...form.getInputProps()}
            style={{
              flex: 1,
              minHeight: 44,
              borderWidth: 0,
              borderRadius: 12,
              backgroundColor: ios.background,
              color: ios.foreground,
              fontSize: 16,
              fontWeight: '700',
            }}
          />
          <IconButton
            label={t('rename')}
            iconName="pencil-outline"
            variant="default"
            disabled={disabled || !canSubmit}
            onPress={form.submit}
          />
          <IconButton
            label={t('cancel')}
            iconName="close-outline"
            disabled={disabled}
            onPress={onCancel}
          />
        </XStack>
      )}
    </MobileForm>
  );
}
