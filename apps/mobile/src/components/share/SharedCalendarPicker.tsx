import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, XStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type SharedCalendarPickerProps = {
  calendars: CalendarItem[];
  selectedCalendarId: string | null;
  onSelectCalendar: (calendarId: string) => void;
};

function truncateName(name: string) {
  return name.length > 20 ? `${name.slice(0, 17)}...` : name;
}

export function SharedCalendarPicker({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
}: SharedCalendarPickerProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack style={{ gap: 8, paddingVertical: 2 }}>
        {calendars.map((calendar) => {
          const isSelected = selectedCalendarId === calendar.id;

          return (
            <Pressable
              key={calendar.id}
              onPress={() => onSelectCalendar(calendar.id)}
              accessibilityRole="button"
              accessibilityLabel={calendar.name || String(t('calendar.label'))}
            >
              {({ pressed }) => (
                <XStack
                  style={{
                    minHeight: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: isSelected ? ios.primary : ios.border,
                    backgroundColor: isSelected ? ios.primary : ios.card,
                    opacity: pressed ? 0.8 : 1,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      maxWidth: 180,
                      color: isSelected ? ios.primaryForeground : ios.foreground,
                      fontSize: 14,
                      lineHeight: 18,
                      fontWeight: '800',
                    }}
                  >
                    {truncateName(calendar.name)}
                  </Text>
                </XStack>
              )}
            </Pressable>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
