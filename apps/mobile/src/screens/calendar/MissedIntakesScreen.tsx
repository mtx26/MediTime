import React, { useMemo, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarDetailSourceType } from '@meditime/types';
import { ALL_TIMES } from '@meditime/constants';
import { CalendarNotFoundState } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { usePageHeaderOptions } from '../../components/common/Page';
import { useMissedIntakes, toDateKey, getBoxTimes } from '../../hooks/calendar/useMissedIntakes';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type MissedIntakesScreenProps = {
  sourceType: Exclude<CalendarDetailSourceType, 'token'>;
};

const TIME_BG: Record<string, string> = {
  morning: '#ff3b3022',
  noon: '#34c75922',
  evening: '#007aff22',
};
const TIME_COLOR: Record<string, string> = {
  morning: '#ff3b30',
  noon: '#34c759',
  evening: '#007aff',
};

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ─── Custom Date-Range Picker (inspired by IosWeekCalendar) ──────────────────

type DateRangePickerProps = {
  fromDate: Date | null;
  toDate: Date | null;
  onFromChange: (d: Date) => void;
  onToChange: (d: Date) => void;
};

function buildMonthWeeks(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstGridDate = new Date(firstOfMonth);
  firstGridDate.setDate(firstOfMonth.getDate() - mondayOffset);
  firstGridDate.setHours(0, 0, 0, 0);

  const dates = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstGridDate);
    d.setDate(firstGridDate.getDate() + i);
    return d;
  });
  return Array.from({ length: 6 }, (_, w) => dates.slice(w * 7, w * 7 + 7));
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function DateRangePicker({ fromDate, toDate, onFromChange, onToChange }: DateRangePickerProps) {
  const { i18n } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const lng = i18n.language ?? 'fr';

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date(TODAY);
    d.setDate(1);
    return d;
  });

  const monthAnimation = React.useRef(new Animated.Value(1)).current;
  const prevMonthIdx = React.useRef(monthDate.getFullYear() * 12 + monthDate.getMonth());
  const transDir = React.useRef(1);
  const monthWeeks = useMemo(() => buildMonthWeeks(monthDate), [monthDate]);
  const todayIso = isoDay(TODAY);
  const fromIso = fromDate ? isoDay(fromDate) : null;
  const toIso = toDate ? isoDay(toDate) : null;

  const weekdayLabels = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const d = new Date(2024, 0, 1);
        while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
        return d.toLocaleDateString(lng, { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase();
      }),
    [lng],
  );

  function shiftMonth(dir: number) {
    hapticSelection();
    const currentIdx = monthDate.getFullYear() * 12 + monthDate.getMonth();
    transDir.current = dir;
    Animated.sequence([
      Animated.timing(monthAnimation, { toValue: 0, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(monthAnimation, { toValue: 1, duration: 120, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
    setMonthDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + dir);
      return next;
    });
    prevMonthIdx.current = currentIdx;
  }

  function handleDayPress(day: Date) {
    if (isoDay(day) > isoDay(TODAY)) return;
    hapticSelection();
    const iso = isoDay(day);

    if (!fromIso || (fromIso && toIso)) {
      // No selection yet OR both set → reset, start new selection
      onFromChange(new Date(day));
    } else {
      // fromDate set, toDate not set
      if (iso >= fromIso) {
        onToChange(new Date(day));
      } else {
        // Tapped before from → shift from, clear to
        onFromChange(new Date(day));
      }
    }
  }

  function getDayStyle(day: Date) {
    const iso = isoDay(day);
    const isFuture = iso > todayIso;
    const isFrom = iso === fromIso;
    const isTo = iso === toIso;
    const inRange = fromIso && toIso && iso > fromIso && iso < toIso;
    const isToday = iso === todayIso;
    const isCurrentMonth = day.getMonth() === monthDate.getMonth();

    return { isFuture, isFrom, isTo, inRange: !!inRange, isToday, isCurrentMonth };
  }

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{ borderRadius: 20, padding: 12, gap: 10 }}
    >
      {/* Month header */}
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => shiftMonth(-1)} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={20} color={ios.primary} />
        </Pressable>
        <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>
          {monthDate.toLocaleDateString(lng, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => shiftMonth(1)} style={{ padding: 6 }}>
          <Ionicons name="chevron-forward" size={20} color={ios.primary} />
        </Pressable>
      </XStack>

      {/* Weekday labels */}
      <XStack style={{ justifyContent: 'space-around' }}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={{ width: 36, textAlign: 'center', color: ios.mutedForeground, fontSize: 11, fontWeight: '600' }}>
            {label}
          </Text>
        ))}
      </XStack>

      {/* Day grid */}
      <Animated.View style={{ opacity: monthAnimation, gap: 4 }}>
        {monthWeeks.map((week) => (
          <XStack key={isoDay(week[0]!)} style={{ justifyContent: 'space-around' }}>
            {week.map((day) => {
              const { isFuture, isFrom, isTo, inRange, isToday, isCurrentMonth } = getDayStyle(day);
              const isEdge = isFrom || isTo;

              let bg: string = 'transparent';
              if (isEdge) bg = ios.primary;
              else if (inRange) bg = `${ios.primary}28`;

              let textColor: string = isCurrentMonth ? ios.foreground : ios.mutedForeground;
              if (isEdge) textColor = ios.primaryForeground;
              else if (isFuture) textColor = ios.border;

              return (
                <Pressable
                  key={isoDay(day)}
                  onPress={() => handleDayPress(day)}
                  disabled={isFuture}
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    backgroundColor: bg,
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: isEdge ? '700' : isToday ? '700' : '400' }}>
                    {day.getDate()}
                  </Text>
                  {isToday && !isEdge ? (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ios.primary, position: 'absolute', bottom: 3 }} />
                  ) : null}
                </Pressable>
              );
            })}
          </XStack>
        ))}
      </Animated.View>
    </GlassView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MissedIntakesScreen({ sourceType }: MissedIntakesScreenProps) {
  const { t, i18n } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const missed = useMissedIntakes(sourceType);
  const lng = i18n.language ?? 'fr';

  const headerOptions = usePageHeaderOptions({
    title: String(t('missed_intakes.title')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
  });

  if (missed.loading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('missed_intakes.loading'))} variant="screen" />
      </>
    );
  }

  if (missed.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={missed.backToCalendars} />
      </>
    );
  }

  const modeLabels = [String(t('missed_intakes.mode_intake')), String(t('missed_intakes.mode_medication'))];
  const dateLabels = [String(t('missed_intakes.individual')), String(t('missed_intakes.range'))];

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        style={{ flex: 1, backgroundColor: ios.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      >
        {missed.error ? (
          <InfoBanner iconName="warning-outline" text={missed.error} tone="warning" />
        ) : null}

        {/* ── Mode selector ───────────────────────────────────────────── */}
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{ borderRadius: 20, padding: 16, gap: 12 }}
        >
          <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
            {String(t('missed_intakes.select_mode'))}
          </Text>
          <SegmentedControl
            appearance={colorScheme}
            values={modeLabels}
            selectedIndex={missed.mode === 'intake' ? 0 : 1}
            onChange={(e) => missed.setMode(e.nativeEvent.selectedSegmentIndex === 0 ? 'intake' : 'medication')}
            style={{ minHeight: 34 }}
          />
        </GlassView>

        {/* ── Medication selector (medication mode) ───────────────────── */}
        {missed.mode === 'medication' ? (
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{ borderRadius: 20, padding: 16, gap: 10 }}
          >
            <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
              {String(t('missed_intakes.select_medication'))}
            </Text>
            {missed.activeBoxes.length === 0 ? (
              <InfoBanner iconName="cube-outline" text={String(t('no_medicines_scheduled'))} />
            ) : (
              missed.activeBoxes.map((box) => {
                const selected = missed.selectedMedIds.includes(box.id);
                const boxTimes = getBoxTimes(box);
                return (
                  <TouchableOpacity
                    key={box.id}
                    onPress={() => missed.toggleMedId(box.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: selected ? `${ios.primary}18` : ios.accentHover,
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 2, borderColor: selected ? ios.primary : ios.border,
                      backgroundColor: selected ? ios.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center', marginTop: 1,
                    }}>
                      {selected ? <Ionicons name="checkmark" size={14} color={ios.primaryForeground} /> : null}
                    </View>
                    <YStack style={{ flex: 1, gap: 4 }}>
                      <XStack style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={{ color: ios.foreground, fontWeight: '600', fontSize: 15 }}>
                          {box.name}{box.dose ? ` (${box.dose} mg)` : ''}
                        </Text>
                        <Text style={{ color: ios.mutedForeground, fontSize: 12 }}>
                          {String(t('missed_intakes.stock'))}: {box.stock_quantity}
                        </Text>
                      </XStack>
                      {boxTimes.length > 0 ? (
                        <XStack style={{ gap: 6, flexWrap: 'wrap' }}>
                          {boxTimes.map((time) => (
                            <View key={time} style={{ backgroundColor: TIME_BG[time] ?? '#88888822', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                              <Text style={{ color: TIME_COLOR[time] ?? ios.mutedForeground, fontSize: 12, fontWeight: '600' }}>
                                {String(t(time))}
                              </Text>
                            </View>
                          ))}
                        </XStack>
                      ) : null}
                    </YStack>
                  </TouchableOpacity>
                );
              })
            )}
          </GlassView>
        ) : null}

        {/* ── Date selection ──────────────────────────────────────────── */}
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{ borderRadius: 20, padding: 16, gap: 12 }}
        >
          <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
            {String(t('missed_intakes.select_days'))}
          </Text>
          <SegmentedControl
            appearance={colorScheme}
            values={dateLabels}
            selectedIndex={missed.dateSelectionMode === 'individual' ? 0 : 1}
            onChange={(e) => missed.setDateSelectionMode(e.nativeEvent.selectedSegmentIndex === 0 ? 'individual' : 'range')}
            style={{ minHeight: 34 }}
          />

          {missed.dateSelectionMode === 'individual' ? (
            <YStack style={{ gap: 12 }}>
              {/* Native Apple calendar picker — tap a date to add/remove it */}
              <DateTimePicker
                value={missed.selectedDates[0] ?? TODAY}
                mode="date"
                display="inline"
                maximumDate={TODAY}
                themeVariant={colorScheme}
                accentColor={ios.primary}
                onChange={(_: DateTimePickerEvent, date?: Date) => {
                  if (date) missed.toggleDate(date);
                }}
                style={{ alignSelf: 'center' }}
              />

              {/* List of selected dates */}
              {missed.selectedDates.length > 0 ? (
                <YStack style={{ gap: 6 }}>
                  <Text style={{ color: ios.mutedForeground, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
                    {missed.selectedDates.length} {String(t('missed_intakes.days_selected'))}
                  </Text>
                  <XStack style={{ flexWrap: 'wrap', gap: 8 }}>
                    {missed.selectedDates.map((d) => (
                      <TouchableOpacity
                        key={toDateKey(d)}
                        onPress={() => missed.toggleDate(d)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: `${ios.primary}22`,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: ios.primary, fontSize: 13, fontWeight: '600' }}>
                          {d.toLocaleDateString(lng, { day: 'numeric', month: 'short' })}
                        </Text>
                        <Ionicons name="close" size={12} color={ios.primary} />
                      </TouchableOpacity>
                    ))}
                  </XStack>
                </YStack>
              ) : null}
            </YStack>
          ) : (
            // Custom range picker (no native range support in iOS DateTimePicker)
            <DateRangePicker
              fromDate={missed.fromDate}
              toDate={missed.toDate}
              onFromChange={(d) => { missed.setFromDate(d); missed.setToDate(null); }}
              onToChange={(d) => { missed.setToDate(d); }}
            />
          )}

          {missed.effectiveDays.length > 0 ? (
            <Text style={{ color: ios.mutedForeground, fontSize: 13 }}>
              {missed.effectiveDays.length} {String(t('missed_intakes.days_selected'))}
            </Text>
          ) : null}
        </GlassView>

        {/* ── Time of day selector (intake mode) ─────────────────────── */}
        {missed.mode === 'intake' && missed.effectiveDays.length > 0 ? (
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{ borderRadius: 20, padding: 16, gap: 12 }}
          >
            <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
              {String(t('missed_intakes.select_times'))}
            </Text>
            <XStack style={{ gap: 8 }}>
              {ALL_TIMES.map((time) => {
                const selected = missed.selectedTimes.includes(time);
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => missed.toggleTime(time)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: selected ? TIME_BG[time] ?? '#88888833' : ios.accentHover,
                      borderWidth: selected ? 1.5 : 0,
                      borderColor: selected ? (TIME_COLOR[time] ?? ios.primary) : 'transparent',
                    }}
                  >
                    <Text style={{ color: selected ? (TIME_COLOR[time] ?? ios.foreground) : ios.mutedForeground, fontWeight: '600', fontSize: 14 }}>
                      {String(t(time))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </XStack>
          </GlassView>
        ) : null}

        {/* ── Next button ─────────────────────────────────────────────── */}
        {missed.isValid ? (
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{ borderRadius: 20, padding: 16 }}
          >
            <TouchableOpacity
              onPress={missed.handleNext}
              style={{ backgroundColor: ios.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: ios.primaryForeground, fontWeight: '700', fontSize: 16 }}>
                {String(t('missed_intakes.next'))}
              </Text>
            </TouchableOpacity>
          </GlassView>
        ) : null}
      </ScrollView>
    </>
  );
}

