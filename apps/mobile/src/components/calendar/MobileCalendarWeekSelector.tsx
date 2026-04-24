import React from 'react';
import { Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { calendarTableHasItems, getWeekDates, getWeekSelectionState, toISO } from '@meditime/utils';
import type { CalendarTable } from '@meditime/types';
import { GlassSurface } from '../common/GlassSurface';
import { useIosTheme } from '../../theme/ios';
import { IosWeekCalendar } from './IosWeekCalendar';

type MobileCalendarWeekSelectorProps = {
  calendarTable: CalendarTable;
  onWeekSelect: (date: Date) => void;
  selectedDate: Date | null;
};

function formatWeekRange(dates: Date[], locale: string) {
  if (dates.length === 0) return '';
  const first = dates[0];
  const last = dates[dates.length - 1];

  if (!first || !last) return '';

  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();

  if (sameMonth) {
    return `${first.getDate()}-${last.getDate()} ${last.toLocaleDateString(locale, { month: 'long' })}`;
  }

  return `${first.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`;
}

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
    setMonthDate((current) => {
      if (
        current.getFullYear() === value.getFullYear()
        && current.getMonth() === value.getMonth()
      ) {
        return current;
      }

      return value;
    });
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

  if (Platform.OS === 'ios') {
    return (
      <GlassSurface
        style={{
          gap: 10,
          padding: 12,
          borderRadius: 14,
        }}
      >
        <Text style={{ color: ios.foreground, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>
          {t('calendar.reference_week')}
        </Text>
        <IosWeekCalendar
          monthDate={monthDate}
          onMonthChange={shiftMonth}
          onSelectDate={onWeekSelect}
          selectedDate={normalizedSelectedDate}
          selectedWeekIsos={selectedWeekIsos}
          locale={i18n.language}
          todayIso={todayIso}
        />
      </GlassSurface>
    );
  }

  return (
    <YStack style={{ gap: 10 }}>
      <GlassSurface
        style={{
          gap: 12,
          padding: 12,
          borderRadius: 14,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Pressable onPress={() => shiftMonth(-1)} accessibilityRole="button">
            <GlassSurface
              glassEffectStyle="clear"
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                borderColor: ios.border,
              }}
            >
              <Ionicons name="chevron-back" size={18} color={ios.primary} />
            </GlassSurface>
          </Pressable>

          <YStack style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: ios.foreground, fontSize: 17, fontWeight: '700', textTransform: 'capitalize' }}>
              {monthDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
            </Text>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, fontWeight: '500' }}>
              {formatWeekRange(weekDates, i18n.language)}
            </Text>
          </YStack>

          <Pressable onPress={() => shiftMonth(1)} accessibilityRole="button">
            <GlassSurface
              glassEffectStyle="clear"
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                borderColor: ios.border,
              }}
            >
              <Ionicons name="chevron-forward" size={18} color={ios.primary} />
            </GlassSurface>
          </Pressable>
        </XStack>

        <XStack style={{ justifyContent: 'space-between', gap: 4 }}>
          {weekdayLabels.map((label) => (
            <Text
              key={label}
              style={{
                width: 38,
                color: ios.mutedForeground,
                fontSize: 12,
                fontWeight: '600',
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
                const isSelectedDate = iso === selectedIso;
                const inSelectedWeek = selectedWeekIsos.has(iso);
                const outsideMonth = date.getMonth() !== monthDate.getMonth();

                const backgroundColor = isSelectedDate
                  ? ios.primary
                  : isToday
                    ? ios.successBg
                    : inSelectedWeek
                      ? ios.accentHover
                      : 'transparent';

                const borderColor = isSelectedDate
                  ? ios.primary
                  : isToday
                    ? ios.success
                    : inSelectedWeek
                      ? ios.border
                      : 'transparent';

                const textColor = isSelectedDate
                  ? ios.primaryForeground
                  : isToday
                    ? ios.success
                    : outsideMonth
                      ? ios.mutedForeground
                      : ios.foreground;

                return (
                  <Pressable key={iso} onPress={() => onWeekSelect(date)} accessibilityRole="button">
                    {isSelectedDate ? (
                      <GlassSurface
                        tintColor={ios.primary}
                        style={{
                          width: 38,
                          height: 36,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          borderColor,
                        }}
                      >
                        <Text
                          style={{
                            color: textColor,
                            opacity: outsideMonth && !isSelectedDate ? 0.55 : 1,
                            fontSize: 15,
                            fontWeight: '700',
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </GlassSurface>
                    ) : (
                      <GlassSurface
                        glassEffectStyle="clear"
                        style={{
                          width: 38,
                          height: 36,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          borderWidth: isToday || inSelectedWeek ? 1 : 0,
                          borderColor,
                          opacity: backgroundColor === 'transparent' ? 0.92 : 1,
                        }}
                        tintColor={backgroundColor === 'transparent' ? undefined : backgroundColor}
                      >
                        <Text
                          style={{
                            color: textColor,
                            opacity: outsideMonth && !isSelectedDate ? 0.55 : 1,
                            fontSize: 15,
                            fontWeight: '600',
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </GlassSurface>
                    )}
                  </Pressable>
                );
              })}
            </XStack>
          ))}
        </YStack>
      </GlassSurface>
    </YStack>
  );
}
