import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, YStack } from 'tamagui';
import ActionSheet from '../components/common/ActionSheet';
import { InfoBanner } from '../components/common/InfoBanner';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { CalendarHeaderTitle } from '../components/calendar/CalendarHeaderTitle';
import { CalendarNotFoundState } from '../components/calendar/CalendarNotFoundState';
import { MobileCalendarWeekSelector } from '../components/calendar/MobileCalendarWeekSelector';
import { MobileWeeklyEventContent } from '../components/calendar/MobileWeeklyEventContent';
import type { CalendarDetailMode, CalendarDetailSourceType } from '@meditime/types';
import { useCalendarDetail } from '../hooks/calendar';
import { useIosTheme } from '../theme/ios';

type CalendarDetailScreenProps = {
  sourceType: CalendarDetailSourceType;
  mode?: CalendarDetailMode;
};

export default function CalendarDetailScreen({
  sourceType,
  mode = 'overview',
}: CalendarDetailScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const detail = useCalendarDetail(sourceType, mode);
  const bottomContentInset = 56 + insets.bottom + 18;

  const headerOptions = {
    headerBackTitleVisible: false,
    headerTitleAlign: 'center' as const,
    headerTitle: () => <CalendarHeaderTitle title={detail.headerTitle} />,
    headerRight: () => (
      detail.actions.length > 0 ? (
        <ActionSheet
          actions={detail.actions}
          buttonSize="sm"
          variant="plain"
          onNavigate={detail.navigateToHref}
        />
      ) : null
    ),
  };

  if (detail.loading && !detail.selectedDate) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_calendar'))} variant="screen" />
      </>
    );
  }

  if (detail.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={detail.backToCalendars} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={(
          <RefreshControl
            refreshing={detail.refreshing}
            onRefresh={detail.handleRefresh}
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
          {detail.error && (
            <InfoBanner iconName="warning-outline" text={detail.error} tone="warning" />
          )}

          {detail.isLowStock && (
            <InfoBanner iconName="warning-outline" text={String(t('stock_alert'))} tone="warning" />
          )}

          <MobileCalendarWeekSelector
            calendarTable={detail.calendarTable}
            selectedDate={detail.selectedDate}
            onWeekSelect={(date) => void detail.selectWeek(date)}
          />

          {detail.showBackendLoading && (
            <LoadingIndicator label={String(t('loading_calendar'))} />
          )}

          {detail.hasCalendarItems ? (
            detail.showDailyContent && (
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
                  selectedDate={detail.selectedDate}
                  eventsForDay={detail.eventsForDay}
                  onSelectDate={detail.selectDate}
                  onPrev={() => detail.navigateDay(-1)}
                  onNext={() => detail.navigateDay(1)}
                  getPastWeek={() => detail.navigateWeek(-1)}
                  getNextWeek={() => detail.navigateWeek(1)}
                />
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
