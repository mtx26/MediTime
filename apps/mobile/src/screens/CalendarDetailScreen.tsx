import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
  calendarTableHasItems,
  filterEventsForDate,
  getInitialSelectedDateForStockMethod,
  toISO,
} from '@meditime/utils';
import type {
  ApiResult,
  CalendarScheduleResult,
  CalendarTable,
  StockMethodResult,
  WeeklyEventItem,
} from '@meditime/types';
import ActionSheet from '../components/common/ActionSheet';
import { InfoBanner } from '../components/common/InfoBanner';
import { OutlineButton } from '../components/common/OutlineButton';
import { MobileCalendarWeekSelector } from '../components/calendar/MobileCalendarWeekSelector';
import { MobileWeeklyEventContent } from '../components/calendar/MobileWeeklyEventContent';
import { useCalendarApis } from '../hooks/calendar';
import { useIosTheme } from '../theme/ios';
import { toActionSheetItems, toMobileHref } from '../utils';

type CalendarDetailScreenProps = {
  sourceType: 'personal' | 'sharedUser';
  mode?: 'overview' | 'daily';
};

type CalendarSource = {
  fetchSchedule: (calendarId: string, startDate?: string | null) => Promise<ApiResult>;
  fetchStockDecrementMethod: (calendarId: string) => Promise<ApiResult>;
  deleteCalendar: (calendarId: string) => Promise<ApiResult>;
  getPdfUrl: (calendarId: string, includeInactive: boolean) => string;
};

const HEADER_TITLE_MAX_LENGTH = 26;

function truncateHeaderTitle(value: string) {
  if (value.length <= HEADER_TITLE_MAX_LENGTH) return value;
  return `${value.slice(0, HEADER_TITLE_MAX_LENGTH - 1)}...`;
}

export default function CalendarDetailScreen({
  sourceType,
  mode = 'overview',
}: CalendarDetailScreenProps) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const lng = i18n.language || 'fr';
  const basePath = sourceType === 'personal' ? 'calendar' : 'shared-user-calendar';
  const bottomContentInset = 56 + insets.bottom + 18;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsForDay, setEventsForDay] = useState<WeeklyEventItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<WeeklyEventItem[]>([]);
  const [calendarTable, setCalendarTable] = useState<CalendarTable>({});
  const [isLowStock, setIsLowStock] = useState(false);
  const [stockDecrementMethod, setStockDecrementMethod] = useState('');
  const [calendarName, setCalendarName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source: CalendarSource = useMemo(() => {
    if (sourceType === 'personal') {
      return {
        fetchSchedule: personalCalendarsApi.fetchPersonalCalendarSchedule,
        fetchStockDecrementMethod: personalCalendarsApi.fetchPersonalStockDecrementMethod,
        deleteCalendar: personalCalendarsApi.deleteCalendar,
        getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
      };
    }

    return {
      fetchSchedule: sharedUserCalendarsApi.fetchSharedUserCalendarSchedule,
      fetchStockDecrementMethod: sharedUserCalendarsApi.fetchSharedUserStockDecrementMethod,
      deleteCalendar: sharedUserCalendarsApi.deleteSharedCalendar,
      getPdfUrl: personalCalendarsApi.getPersonalCalendarPdfUrl,
    };
  }, [personalCalendarsApi, sharedUserCalendarsApi, sourceType]);

  const loadSchedule = useCallback(
    async (date: Date, showRefresh = false) => {
      if (!calendarId) return;
      if (showRefresh) setRefreshing(true);
      if (!showRefresh) setScheduleLoading(true);
      setError(null);

      try {
        const result = await source.fetchSchedule(calendarId, toISO(date)) as CalendarScheduleResult;

        if (result.success) {
          const nextEvents = result.schedule ?? [];
          const nextTable = result.table ?? {};
          setCalendarEvents(nextEvents);
          setCalendarTable(nextTable);
          setEventsForDay(filterEventsForDate(nextEvents, date));
          setIsLowStock(Boolean(result.ifLowStock));
          if (result.calendarName) setCalendarName(result.calendarName);
          setNotFound(false);
          return;
        }

        if (result.status === 404) {
          setNotFound(true);
          return;
        }

        setError(result.error ?? String(t('error')));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(t('error')));
      } finally {
        if (showRefresh) setRefreshing(false);
        if (!showRefresh) setScheduleLoading(false);
      }
    },
    [calendarId, source, t],
  );

  const loadCalendar = useCallback(async () => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stockResult = await source.fetchStockDecrementMethod(calendarId) as StockMethodResult;
      const method = stockResult.success ? stockResult.method ?? '' : '';
      const initialDate = getInitialSelectedDateForStockMethod(method);

      if (!stockResult.success && stockResult.status === 404) {
        setNotFound(true);
      }

      setStockDecrementMethod(method);
      setSelectedDate(initialDate);
      await loadSchedule(initialDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('error')));
    } finally {
      setLoading(false);
    }
  }, [calendarId, loadSchedule, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadCalendar();
    }, [loadCalendar]),
  );

  useEffect(() => {
    if (!selectedDate) return;
    setEventsForDay(filterEventsForDate(calendarEvents, selectedDate));
  }, [calendarEvents, selectedDate]);

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const navigateToHref = useCallback(
    (href: string) => {
      router.push(toMobileHref(href) as never);
    },
    [router],
  );

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setEventsForDay(filterEventsForDate(calendarEvents, date));
  };

  const selectWeek = async (date: Date) => {
    setSelectedDate(date);
    await loadSchedule(date);
  };

  const navigateDay = (direction: number) => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction);
    selectDate(next);
  };

  const navigateWeek = (direction: number) => {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction * 7);
    void selectWeek(next);
  };

  const handleRefresh = () => {
    if (selectedDate) {
      void loadSchedule(selectedDate, true);
      return;
    }
    void loadCalendar();
  };

  const handleDelete = () => {
    Alert.alert(
      String(t(sourceType === 'personal' ? 'calendar.delete_title' : 'calendar.delete_shared_title')),
      String(t(sourceType === 'personal' ? 'calendar.delete_description' : 'calendar.delete_shared_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            if (!calendarId) return;
            void source.deleteCalendar(calendarId).then((result) => {
              if (result.success) {
                router.replace('/calendars' as never);
                return;
              }
              Alert.alert(String(t('error')), result.error ?? String(t('error')));
            });
          },
        },
      ],
    );
  };

  const handleExportPdf = async () => {
    if (!calendarId) return;
    try {
      await Linking.openURL(source.getPdfUrl(calendarId, false));
    } catch {
      Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
    }
  };

  const actions = useMemo(() => {
    if (!calendarId) return [];

    const context = { calendarId, lng, basePath, selectedDate };
    const handlers = {
      onDelete: handleDelete,
      onExportPdf: () => void handleExportPdf(),
    };
    const items = sourceType === 'personal'
      ? buildPersonalCalendarActions(
          context,
          { ...handlers, onRename: undefined },
          ['rename', 'medicines'],
        )
      : buildSharedCalendarActions(context, handlers, ['medicines']);

    return toActionSheetItems(items, translate);
  }, [basePath, calendarId, lng, selectedDate, sourceType, translate]);

  const headerTitle = truncateHeaderTitle(calendarName ?? String(t('calendars')));
  const headerOptions = {
    headerBackTitleVisible: false,
    headerTitleAlign: 'center' as const,
    headerTitle: () => (
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          maxWidth: 180,
          color: ios.foreground,
          fontSize: 17,
          fontWeight: '800',
          textAlign: 'center',
        }}
      >
        {headerTitle}
      </Text>
    ),
    headerRight: () => (
      actions.length > 0 ? (
        <ActionSheet actions={actions} buttonSize="sm" variant="plain" onNavigate={navigateToHref} />
      ) : null
    ),
  };

  const goToBoxes = () => {
    if (!calendarId) return;
    router.push(`/calendars/${basePath}/${calendarId}/boxes` as never);
  };

  const goToPillbox = () => {
    if (!calendarId) return;
    const date = toISO(selectedDate || new Date());
    router.push(`/calendars/${basePath}/${calendarId}/pillbox?date=${date}` as never);
  };

  if (loading && !selectedDate) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background, gap: 12 }}>
          <Spinner size="large" color={ios.primary} />
          <Text style={{ color: ios.mutedForeground, fontWeight: '700' }}>{t('loading_calendar')}</Text>
        </YStack>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <YStack
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: 14,
            padding: 18,
            backgroundColor: ios.background,
          }}
        >
          <YStack
            style={{
              gap: 10,
              padding: 16,
              borderRadius: 8,
              backgroundColor: ios.card,
              borderWidth: 1,
              borderColor: ios.border,
            }}
          >
            <Text style={{ color: ios.foreground, fontSize: 20, fontWeight: '900' }}>{t('not_found')}</Text>
            <Text style={{ color: ios.mutedForeground, lineHeight: 20 }}>{t('invalid_or_expired_link')}</Text>
            <OutlineButton label={String(t('calendars'))} onPress={() => router.replace('/calendars' as never)} />
          </YStack>
        </YStack>
      </>
    );
  }

  const hasCalendarItems = calendarTableHasItems(calendarTable);
  const showPillboxShortcut = hasCalendarItems && stockDecrementMethod === STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX;
  const showDailyContent = mode === 'daily' || stockDecrementMethod === STOCK_DECREMENT_METHODS.DAILY_MIDNIGHT;

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ios.primary}
            colors={[ios.primary]}
            progressBackgroundColor={ios.card}
          />
        )}
      >
        <YStack
          style={{
            flex: 1,
            gap: 18,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: bottomContentInset,
            backgroundColor: ios.background,
          }}
        >
          <Button
            onPress={goToBoxes}
            style={{
              minHeight: 44,
              borderRadius: 8,
              backgroundColor: ios.card,
              borderWidth: 1,
              borderColor: ios.border,
            }}
          >
            <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="medkit-outline" size={18} color={ios.primary} />
              <Text style={{ color: ios.foreground, fontWeight: '800' }}>{t('medicines.label')}</Text>
            </XStack>
          </Button>

        {error && (
          <YStack
            style={{
              gap: 10,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ios.destructiveBorder,
              backgroundColor: ios.destructiveBg,
            }}
          >
            <Text style={{ color: ios.destructive, fontWeight: '800' }}>{error}</Text>
            <OutlineButton label={String(t('retry'))} onPress={handleRefresh} />
          </YStack>
        )}

        {isLowStock && (
          <Pressable
            onPress={() => {
              if (!calendarId) return;
              router.push(`/calendars/${basePath}/${calendarId}/stock-alerts` as never);
            }}
            accessibilityRole="button"
          >
            <InfoBanner iconName="warning-outline" text={String(t('stock_alert'))} tone="warning" />
          </Pressable>
        )}

        <MobileCalendarWeekSelector
          calendarTable={calendarTable}
          selectedDate={selectedDate}
          onWeekSelect={(date) => void selectWeek(date)}
        />

        {scheduleLoading && !loading && (
          <XStack
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 8,
            }}
          >
            <Spinner size="small" color={ios.primary} />
            <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
              {t('loading_calendar')}
            </Text>
          </XStack>
        )}

        {showPillboxShortcut && (
          <YStack style={{ gap: 10 }}>
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="grid-outline" size={20} color={ios.primary} />
              <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '800' }}>
                {t('pillbox.title')}
              </Text>
            </XStack>
            <Button
              onPress={goToPillbox}
              style={{
                minHeight: 44,
                borderRadius: 8,
                backgroundColor: ios.blueInfoBg,
              }}
            >
              <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="grid-outline" size={18} color={ios.primary} />
                <Text style={{ color: ios.primary, fontWeight: '900' }}>{t('pillbox.fill')}</Text>
              </XStack>
            </Button>
          </YStack>
        )}

        {hasCalendarItems ? (
          showDailyContent && (
            <YStack style={{ gap: 12 }}>
              <YStack
                style={{
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: ios.border,
                  backgroundColor: ios.card,
                }}
              >
                <MobileWeeklyEventContent
                  selectedDate={selectedDate}
                  eventsForDay={eventsForDay}
                  onSelectDate={selectDate}
                  onPrev={() => navigateDay(-1)}
                  onNext={() => navigateDay(1)}
                  getPastWeek={() => navigateWeek(-1)}
                  getNextWeek={() => navigateWeek(1)}
                />
              </YStack>
            </YStack>
          )
        ) : (
          <InfoBanner iconName="pin-outline" text={String(t('no_medicines'))} />
        )}
        </YStack>
      </ScrollView>
    </>
  );
}
