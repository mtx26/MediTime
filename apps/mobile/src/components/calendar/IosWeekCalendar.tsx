import React from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { getWeekDates, getMondayDate, toISO } from '@meditime/utils';
import { useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type IosWeekCalendarProps = {
  monthDate: Date;
  onMonthChange: (direction: number) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  selectedWeekIsos: Set<string>;
  preparedWeekMondayIsos?: Set<string>;
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
  preparedWeekMondayIsos,
  locale,
  todayIso,
}: IosWeekCalendarProps) {
  const ios = useIosTheme();
  const selectedIso = toISO(selectedDate);
  const monthAnimation = React.useRef(new Animated.Value(1)).current;
  const didMount = React.useRef(false);
  const transitionDirection = React.useRef(1);
  const previousMonthIndex = React.useRef(monthDate.getFullYear() * 12 + monthDate.getMonth());
  const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
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

  React.useEffect(() => {
    const currentMonthIndex = monthDate.getFullYear() * 12 + monthDate.getMonth();

    if (!didMount.current) {
      didMount.current = true;
      previousMonthIndex.current = currentMonthIndex;
      return;
    }

    if (currentMonthIndex !== previousMonthIndex.current) {
      transitionDirection.current = currentMonthIndex > previousMonthIndex.current ? 1 : -1;
      previousMonthIndex.current = currentMonthIndex;
    }

    monthAnimation.setValue(0);
    Animated.timing(monthAnimation, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [monthAnimation, monthDate, monthKey]);

  const animatedMonthStyle = {
    opacity: monthAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1],
    }),
    transform: [
      {
        translateX: monthAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [transitionDirection.current * 26, 0],
        }),
      },
    ],
  };

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
          <Pressable
            onPress={() => {
              transitionDirection.current = -1;
              onMonthChange(-1);
            }}
            accessibilityRole="button"
          >
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

          <Pressable
            onPress={() => {
              transitionDirection.current = 1;
              onMonthChange(1);
            }}
            accessibilityRole="button"
          >
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

      <Animated.View style={animatedMonthStyle}>
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

        <YStack style={{ gap: 2, marginTop: 14 }}>
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
                const isPreparedWeek = preparedWeekMondayIsos?.has(toISO(getMondayDate(date)!)) ?? false;
                const highlightWeek = inSelectedWeek || isPreparedWeek;
                const weekBg = isPreparedWeek ? ios.successBg : inSelectedWeek ? ios.accentHover : 'transparent';

                return (
                  <Pressable
                    key={iso}
                    onPress={() => {
                      if (iso !== selectedIso) hapticSelection();
                      onSelectDate(date);
                    }}
                    accessibilityRole="button"
                  >
                    <YStack
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopLeftRadius: highlightWeek && isWeekStart ? 18 : 0,
                        borderBottomLeftRadius: highlightWeek && isWeekStart ? 18 : 0,
                        borderTopRightRadius: highlightWeek && isWeekEnd ? 18 : 0,
                        borderBottomRightRadius: highlightWeek && isWeekEnd ? 18 : 0,
                        backgroundColor: weekBg,
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
      </Animated.View>
    </YStack>
  );
}
