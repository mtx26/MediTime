import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { getWeekSelectionState, toISO } from '@meditime/utils';
import type { WeeklyEventItem } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type MobileWeeklyEventContentProps = {
  selectedDate: Date | null;
  eventsForDay: WeeklyEventItem[];
  onSelectDate: (date: Date) => void;
  onNext: () => void;
  onPrev: () => void;
  getPastWeek: () => void;
  getNextWeek: () => void;
};

export function MobileWeeklyEventContent({
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getPastWeek,
  getNextWeek,
}: MobileWeeklyEventContentProps) {
  const { t, i18n } = useTranslation();
  const ios = useIosTheme();
  const {
    selectedDate: normalizedSelectedDate,
    weekDates,
    isFirstDay,
    isLastDay,
  } = getWeekSelectionState(selectedDate);
  const selectedIso = toISO(normalizedSelectedDate);

  const goPrev = isFirstDay ? getPastWeek : onPrev;
  const goNext = isLastDay ? getNextWeek : onNext;

  return (
    <YStack style={{ gap: 12 }}>
      <XStack style={{ justifyContent: 'space-between', gap: 6 }}>
        {weekDates.map((date) => {
          const iso = toISO(date);
          const selected = iso === selectedIso;

          return (
            <Pressable key={iso} onPress={() => onSelectDate(date)} accessibilityRole="button">
              <YStack
                style={{
                  width: 42,
                  minHeight: 54,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: selected ? ios.primary : ios.card,
                  borderWidth: selected ? 0 : 1,
                  borderColor: ios.border,
                }}
              >
                <Text style={{ color: selected ? ios.primaryForeground : ios.mutedForeground, fontSize: 11, fontWeight: '800' }}>
                  {date.toLocaleDateString(i18n.language, { weekday: 'short' }).slice(0, 2)}
                </Text>
                <Text style={{ color: selected ? ios.primaryForeground : ios.foreground, fontSize: 16, fontWeight: '900' }}>
                  {date.getDate()}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>

      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Pressable onPress={goPrev} accessibilityRole="button">
          <YStack
            style={{
              width: 42,
              height: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: ios.blueInfoBg,
            }}
          >
            <Ionicons name="arrow-back" size={19} color={ios.primary} />
          </YStack>
        </Pressable>

        <YStack style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
            {normalizedSelectedDate.toLocaleDateString(i18n.language, { weekday: 'long' })}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>
            {normalizedSelectedDate.toLocaleDateString(i18n.language, {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </YStack>

        <Pressable onPress={goNext} accessibilityRole="button">
          <YStack
            style={{
              width: 42,
              height: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: ios.blueInfoBg,
            }}
          >
            <Ionicons name="arrow-forward" size={19} color={ios.primary} />
          </YStack>
        </Pressable>
      </XStack>

      {eventsForDay.length > 0 ? (
        <YStack style={{ gap: 10 }}>
          {eventsForDay.map((event) => {
            const time = new Date(event.start).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <XStack
                key={`${event.start}-${event.title}`}
                style={{
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: ios.card,
                  borderWidth: 1,
                  borderColor: ios.border,
                }}
              >
                <YStack
                  style={{
                    width: 58,
                    minHeight: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: event.color || ios.primary,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>{time}</Text>
                </YStack>

                <YStack style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                    {event.title}
                  </Text>
                  {event.dose != null && (
                    <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
                      {event.dose} mg
                    </Text>
                  )}
                  {event.notes && (
                    <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
                      {event.notes}
                    </Text>
                  )}
                </YStack>

                {event.tablet_count != null && (
                  <YStack
                    style={{
                      minWidth: 34,
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      backgroundColor: ios.background,
                    }}
                  >
                    <Text style={{ color: ios.foreground, fontWeight: '900' }}>
                      {event.tablet_count}
                    </Text>
                  </YStack>
                )}
              </XStack>
            );
          })}
        </YStack>
      ) : (
        <Text style={{ color: ios.mutedForeground, textAlign: 'center', fontWeight: '700' }}>
          {t('no_events_today')}
        </Text>
      )}
    </YStack>
  );
}
