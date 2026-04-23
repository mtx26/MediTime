import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import type { SharedCalendarPickerProps } from '@meditime/types';
import { useAppTheme } from '../../theme/ios';

function truncateName(name: string) {
  return name.length > 20 ? `${name.slice(0, 17)}...` : name;
}

export function SharedCalendarPicker({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
}: SharedCalendarPickerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const selectedIndex = Math.max(0, calendars.findIndex((calendar) => calendar.id === selectedCalendarId));

  return (
    <YStack style={{ gap: 8 }}>
      <SegmentedControl
        appearance={colorScheme}
        values={calendars.map((calendar) => truncateName(calendar.name || String(t('calendar.label'))))}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          const nextCalendar = calendars[event.nativeEvent.selectedSegmentIndex];
          if (nextCalendar) {
            onSelectCalendar(nextCalendar.id);
          }
        }}
        style={{
          minHeight: 34,
        }}
      />
    </YStack>
  );
}
