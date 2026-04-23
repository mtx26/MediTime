import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState, PillboxUseRow } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, PageTitle, usePageHeaderOptions } from '../../components/common/Page';
import { usePillboxUses } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type PillboxUsesScreenProps = {
  sourceType: CalendarDetailSourceType;
};

export default function PillboxUsesScreen({ sourceType }: PillboxUsesScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const pillboxUses = usePillboxUses(sourceType);

  const headerOptions = usePageHeaderOptions({
    title: String(t('pillbox_uses')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
  });

  if (pillboxUses.loading && pillboxUses.sortedUses.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_pillbox_uses'))} variant="screen" />
      </>
    );
  }

  if (pillboxUses.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={pillboxUses.backToCalendars} />
      </>
    );
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={pillboxUses.refreshing}
          onRefresh={() => void pillboxUses.loadUses('refresh')}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={14}
      withBottomTabInset
    >
      <PageTitle iconName="time-outline" title={String(t('pillbox_uses'))} />

      {pillboxUses.error && (
        <YStack style={{ gap: 10 }}>
          <InfoBanner iconName="warning-outline" text={pillboxUses.error} tone="warning" />
          <OutlineButton label={String(t('retry'))} onPress={() => void pillboxUses.loadUses('refresh')} />
        </YStack>
      )}

      {pillboxUses.sortedUses.length === 0 ? (
        <InfoBanner iconName="time-outline" text={String(t('you_have_no_pillbox_use_history'))} />
      ) : (
        <YStack style={{ gap: 10 }}>
          {pillboxUses.sortedUses.map((use) => (
            <PillboxUseRow
              key={use.id}
              use={use}
              weekLabel={pillboxUses.formatWeek(use.prepared_at)}
              disabled={pillboxUses.isMutating}
              onCancel={pillboxUses.confirmCancelUse}
            />
          ))}
        </YStack>
      )}
    </Page>
  );
}
