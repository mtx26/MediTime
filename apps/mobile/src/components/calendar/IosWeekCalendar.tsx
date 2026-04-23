import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { getWeekDates, toISO } from '@meditime/utils';
import { useIosTheme } from '../../theme/ios';

type IosWeekCalendarProps = {
  monthDate: Date;
  onMonthChange: (direction: number) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  selectedWeekIsos: Set<string>;
  locale: string;
  todayIso: string;
};

function buildMonthWeeks(monthDate: Date) {
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
}

export function IosWeekCalendar({
  monthDate,
  onMonthChange,
  onSelectDate,
  selectedDate,
  selectedWeekIsos,
  locale,
  todayIso,
}: IosWeekCalendarProps) {
  const ios = useIosTheme();
  const selectedIso = toISO(selectedDate);
  const monthWeeks = React.useMemo(() => buildMonthWeeks(monthDate), [monthDate]);
  const monthLabel = React.useMemo(
    () => monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    [locale, monthDate],
  );
  const weekdayLabels = React.useMemo(
    () =>
      getWeekDates(new Date(2024, 0, 1)).map((date) =>
        date
          .toLocaleDateString(locale, { weekday: 'short' })
          .replace('.', '')
          .slice(0, 3)
          .toUpperCase(),
      ),
    [locale],
  );

  return (
    <YStack
      style={{
        gap: 14,
        paddingHorizontal: 6,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            color: ios.foreground,
            fontSize: 16,
            lineHeight: 20,
            fontWeight: '700',
            textTransform: 'capitalize',
          }}
        >
          {monthLabel}
        </Text>

        <XStack style={{ alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => onMonthChange(-1)} accessibilityRole="button">
            <YStack
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={22} color={ios.primary} />
            </YStack>
          </Pressable>

          <Pressable onPress={() => onMonthChange(1)} accessibilityRole="button">
            <YStack
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-forward" size={22} color={ios.primary} />
            </YStack>
          </Pressable>
        </XStack>
      </XStack>

      <XStack style={{ justifyContent: 'space-between', paddingHorizontal: 2 }}>
        {weekdayLabels.map((label) => (
          <Text
            key={label}
            style={{
              width: 44,
              color: ios.mutedForeground,
              fontSize: 10,
              lineHeight: 12,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        ))}
      </XStack>

      <YStack style={{ gap: 2 }}>
        {monthWeeks.map((weekDates) => (
          <XStack key={toISO(weekDates[0])} style={{ justifyContent: 'space-between', gap: 0 }}>
            {weekDates.map((date, index) => {
              const iso = toISO(date);
              const isSelectedDate = iso === selectedIso;
              const isToday = iso === todayIso;
              const inSelectedWeek = selectedWeekIsos.has(iso);
              const outsideMonth = date.getMonth() !== monthDate.getMonth();
              const isWeekStart = index === 0;
              const isWeekEnd = index === 6;

              return (
                <Pressable key={iso} onPress={() => onSelectDate(date)} accessibilityRole="button">
                  <YStack
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: inSelectedWeek && isWeekStart ? 18 : 0,
                      borderBottomLeftRadius: inSelectedWeek && isWeekStart ? 18 : 0,
                      borderTopRightRadius: inSelectedWeek && isWeekEnd ? 18 : 0,
                      borderBottomRightRadius: inSelectedWeek && isWeekEnd ? 18 : 0,
                      backgroundColor: inSelectedWeek ? ios.accentHover : 'transparent',
                    }}
                  >
                    <YStack
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 18,
                        backgroundColor: isSelectedDate ? ios.blueInfoBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: isSelectedDate
                            ? ios.primary
                            : isToday
                              ? ios.primary
                            : outsideMonth
                              ? ios.mutedForeground
                              : ios.foreground,
                          opacity: outsideMonth && !isSelectedDate ? 0.35 : 1,
                          fontSize: 18,
                          lineHeight: 22,
                          fontWeight: isSelectedDate ? '700' : '400',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </YStack>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}
