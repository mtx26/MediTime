import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { calendarTableHasItems, getWeekDates, getWeekSelectionState, toISO } from '@meditime/utils';
import type { CalendarTable } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type MobileCalendarWeekSelectorProps = {
  calendarTable: CalendarTable;
  onWeekSelect: (date: Date) => void;
  selectedDate: Date | null;
};

export function MobileCalendarWeekSelector({
  calendarTable,
  onWeekSelect,
  selectedDate,
}: MobileCalendarWeekSelectorProps) {
  const { t, i18n } = useTranslation();
  const ios = useIosTheme();
  const { weekDates, selectedDate: normalizedSelectedDate } = getWeekSelectionState(selectedDate);
  const selectedIso = toISO(normalizedSelectedDate);
  const todayIso = toISO(new Date());
  const selectedWeekIsos = new Set(weekDates.map(toISO));

  const [monthDate, setMonthDate] = React.useState(() => {
    const value = new Date(normalizedSelectedDate);
    value.setDate(1);
    return value;
  });

  React.useEffect(() => {
    const value = new Date(normalizedSelectedDate);
    value.setDate(1);
    setMonthDate(value);
  }, [selectedIso]);

  const monthWeeks = React.useMemo(() => {
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const firstGridDate = new Date(firstOfMonth);
    firstGridDate.setDate(firstOfMonth.getDate() - mondayOffset);
    firstGridDate.setHours(0, 0, 0, 0);

    const dates = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDate);
      date.setDate(firstGridDate.getDate() + index);
      return date;
    });

    return Array.from({ length: 6 }, (_, weekIndex) =>
      dates.slice(weekIndex * 7, weekIndex * 7 + 7),
    );
  }, [monthDate]);

  const weekdayLabels = getWeekDates(new Date(2024, 0, 1)).map((date) =>
    date.toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0, 2),
  );

  const shiftMonth = (direction: number) => {
    setMonthDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  };

  if (!calendarTableHasItems(calendarTable)) return null;

  return (
    <YStack style={{ gap: 10 }}>
      <YStack
        style={{
          gap: 10,
          padding: 10,
          borderRadius: 8,
          backgroundColor: ios.card,
          borderWidth: 1,
          borderColor: ios.border,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Pressable onPress={() => shiftMonth(-1)} accessibilityRole="button">
            <YStack
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: ios.blueInfoBg,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={ios.primary} />
            </YStack>
          </Pressable>

          <YStack style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '900', textTransform: 'capitalize' }}>
              {monthDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
            </Text>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, fontWeight: '700' }}>
              {t('calendar.reference_week')}
            </Text>
          </YStack>

          <Pressable onPress={() => shiftMonth(1)} accessibilityRole="button">
            <YStack
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: ios.blueInfoBg,
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={ios.primary} />
            </YStack>
          </Pressable>
        </XStack>

        <XStack style={{ justifyContent: 'space-between', gap: 4 }}>
          {weekdayLabels.map((label) => (
            <Text
              key={label}
              style={{
                width: 40,
                color: ios.mutedForeground,
                fontSize: 11,
                fontWeight: '900',
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          ))}
        </XStack>

        <YStack style={{ gap: 6 }}>
          {monthWeeks.map((weekDatesInMonth) => (
            <XStack key={toISO(weekDatesInMonth[0])} style={{ justifyContent: 'space-between', gap: 4 }}>
              {weekDatesInMonth.map((date) => {
                const iso = toISO(date);
                const isToday = iso === todayIso;
                const inSelectedWeek = selectedWeekIsos.has(iso);
                const outsideMonth = date.getMonth() !== monthDate.getMonth();
                const backgroundColor = isToday
                    ? ios.success
                    : inSelectedWeek
                      ? ios.blueInfoBg
                      : 'transparent';

                return (
                  <Pressable key={iso} onPress={() => onWeekSelect(date)} accessibilityRole="button">
                    <YStack
                      style={{
                        width: 40,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        backgroundColor,
                        borderWidth: inSelectedWeek && !isToday ? 1 : 0,
                        borderColor: isToday ? ios.success : ios.blueInfoBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: isToday
                            ? ios.primaryForeground
                            : outsideMonth
                              ? ios.mutedForeground
                              : inSelectedWeek
                                ? ios.primary
                                : ios.foreground,
                          opacity: outsideMonth ? 0.55 : 1,
                          fontSize: 14,
                          fontWeight: '900',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </YStack>
                  </Pressable>
                );
              })}
            </XStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  );
}
