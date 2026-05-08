import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { getWeekSelectionState, toISO } from '@meditime/utils';
import type { WeeklyEventItem } from '@meditime/types';
import { GlassSurface } from '../common/GlassSurface';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type MobileWeeklyEventContentProps = {
  selectedDate: Date | null;
  eventsForDay: WeeklyEventItem[];
  onSelectDate: (date: Date) => void;
  onNext: () => void;
  onPrev: () => void;
  getPastWeek: () => void;
  getNextWeek: () => void;
  isLoading?: boolean;
  showInlineWeekStrip?: boolean;
};

export function MobileWeeklyEventContent({
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getPastWeek,
  getNextWeek,
  isLoading = false,
  showInlineWeekStrip = true,
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
    <YStack style={{ gap: 14 }}>
      {showInlineWeekStrip ? (
        <XStack style={{ justifyContent: 'space-between', gap: 8 }}>
          {weekDates.map((date) => {
            const iso = toISO(date);
            const selected = iso === selectedIso;
            const isToday = iso === toISO(new Date());

            return (
              <Pressable
                key={iso}
                onPress={() => {
                  if (!selected) hapticSelection();
                  onSelectDate(date);
                }}
                accessibilityRole="button"
              >
                {({ pressed }) => (
                  selected ? (
                    <GlassSurface
                      tintColor={ios.primary}
                      style={{
                        width: 44,
                        minHeight: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        borderColor: ios.primary,
                        gap: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: ios.primaryForeground,
                          fontSize: 11,
                          lineHeight: 14,
                          fontWeight: '800',
                        }}
                      >
                        {date.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').slice(0, 2)}
                      </Text>
                      <Text
                        style={{
                          color: ios.primaryForeground,
                          fontSize: 18,
                          lineHeight: 22,
                          fontWeight: '900',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                      <YStack
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          backgroundColor: isToday ? ios.primaryForeground : 'transparent',
                        }}
                      />
                    </GlassSurface>
                  ) : (
                    <GlassSurface
                      glassEffectStyle="clear"
                      style={{
                        width: 44,
                        minHeight: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        borderColor: pressed || isToday ? ios.primary : ios.border,
                        gap: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: ios.mutedForeground,
                          fontSize: 11,
                          lineHeight: 14,
                          fontWeight: '800',
                        }}
                      >
                        {date.toLocaleDateString(i18n.language, { weekday: 'short' }).replace('.', '').slice(0, 2)}
                      </Text>
                      <Text
                        style={{
                          color: ios.foreground,
                          fontSize: 18,
                          lineHeight: 22,
                          fontWeight: '900',
                        }}
                      >
                        {date.getDate()}
                      </Text>
                      <YStack
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          backgroundColor: isToday ? ios.primary : 'transparent',
                        }}
                      />
                    </GlassSurface>
                  )
                )}
              </Pressable>
            );
          })}
        </XStack>
      ) : null}

      <XStack
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 4,
        }}
      >
        <Pressable
          onPress={() => {
            hapticSelection();
            goPrev();
          }}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <GlassSurface
              glassEffectStyle="clear"
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderColor: pressed ? ios.primary : ios.border,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={ios.primary} />
            </GlassSurface>
          )}
        </Pressable>

        <YStack style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' }}>
            {normalizedSelectedDate.toLocaleDateString(i18n.language, { weekday: 'long' })}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900', textAlign: 'center' }}>
            {normalizedSelectedDate.toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </YStack>

        <Pressable
          onPress={() => {
            hapticSelection();
            goNext();
          }}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <GlassSurface
              glassEffectStyle="clear"
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderColor: pressed ? ios.primary : ios.border,
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={ios.primary} />
            </GlassSurface>
          )}
        </Pressable>
      </XStack>

      {isLoading ? (
        <GlassSurface
          glassEffectStyle="clear"
          style={{
            paddingHorizontal: 18,
            paddingVertical: 22,
            borderRadius: 24,
          }}
        >
          <LoadingIndicator label={String(t('loading_calendar'))} />
        </GlassSurface>
      ) : eventsForDay.length > 0 ? (
        <YStack style={{ gap: 10 }}>
          {eventsForDay.map((event) => {
            const time = new Date(event.start).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <GlassSurface
                key={`${event.start}-${event.title}`}
                glassEffectStyle="clear"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderRadius: 24,
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 12 }}>
                  <YStack
                    style={{
                      width: 68,
                      minHeight: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 16,
                      backgroundColor: ios.blueInfoBg,
                      borderWidth: 1,
                      borderColor: ios.blueInfoBorder,
                    }}
                  >
                    <Text style={{ color: ios.primary, fontWeight: '900', fontSize: 13, lineHeight: 18 }}>{time}</Text>
                  </YStack>

                  <YStack style={{ flex: 1, gap: 4 }}>
                    <XStack style={{ alignItems: 'center', gap: 8 }}>
                      <YStack
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: event.color || ios.primary,
                        }}
                      />
                      <Text style={{ flex: 1, color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '800' }}>
                        {event.title}
                      </Text>
                    </XStack>
                    {event.dose != null ? (
                      <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                        {event.dose} mg
                      </Text>
                    ) : null}
                    {event.notes ? (
                      <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
                        {event.notes}
                      </Text>
                    ) : null}
                  </YStack>

                  {event.tablet_count != null ? (
                    <GlassSurface
                      glassEffectStyle="clear"
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        borderColor: ios.border,
                      }}
                    >
                      <Text style={{ color: ios.foreground, fontWeight: '900', fontSize: 16, lineHeight: 20 }}>
                        {event.tablet_count}
                      </Text>
                      <Text style={{ color: ios.mutedForeground, fontSize: 10, lineHeight: 12, fontWeight: '700' }}>
                        {Number(event.tablet_count) > 1 ? t('tablets') : t('tablet')}
                      </Text>
                    </GlassSurface>
                  ) : null}
                </XStack>
              </GlassSurface>
            );
          })}
        </YStack>
      ) : (
        <GlassSurface
          glassEffectStyle="clear"
          style={{
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 18,
            paddingVertical: 22,
            borderRadius: 24,
          }}
        >
          <Ionicons name="moon-outline" size={22} color={ios.mutedForeground} />
          <Text style={{ color: ios.foreground, textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '700' }}>
            {t('no_events_today')}
          </Text>
          <Text style={{ color: ios.mutedForeground, textAlign: 'center', fontSize: 13, lineHeight: 18 }}>
            {normalizedSelectedDate.toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </GlassSurface>
      )}
    </YStack>
  );
}
