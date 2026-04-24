import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState, MedicineBoxCard } from '../../components/calendar';
import ActionSheet from '../../components/common/ActionSheet';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { useStockAlerts } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type StockAlertsScreenProps = {
  sourceType: Exclude<CalendarDetailSourceType, 'token'>;
};

export default function StockAlertsScreen({ sourceType }: StockAlertsScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const stockAlerts = useStockAlerts(sourceType);

  const headerOptions = usePageHeaderOptions({
    title: String(t('stock_alerts')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
    headerRight: () => (
      stockAlerts.actions.length > 0 ? (
        <ActionSheet
          actions={stockAlerts.actions}
          buttonSize="sm"
          variant="plain"
          onNavigate={stockAlerts.navigateToHref}
        />
      ) : null
    ),
  });

  if (stockAlerts.loading && stockAlerts.alerts.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_stock_alerts'))} variant="screen" />
      </>
    );
  }

  if (stockAlerts.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={stockAlerts.backToCalendars} />
      </>
    );
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={stockAlerts.refreshing}
          onRefresh={() => void stockAlerts.loadAlerts('refresh')}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={14}
      withBottomTabInset
    >
      {stockAlerts.error ? (
        <>
          <InfoBanner iconName="warning-outline" text={stockAlerts.error} tone="warning" />
          <OutlineButton label={String(t('retry'))} onPress={() => void stockAlerts.loadAlerts('refresh')} />
        </>
      ) : null}

      {stockAlerts.alerts.length === 0 ? (
        <InfoBanner iconName="checkmark-circle-outline" text={String(t('no_low_stock'))} />
      ) : (
        stockAlerts.alerts.map((box) => (
          <MedicineBoxCard
            key={box.id}
            box={box}
            disabled={stockAlerts.restockingBoxId === box.id}
            onMissingPillbox={stockAlerts.navigateToMissingPillbox}
            onRestock={stockAlerts.restockBox}
          />
        ))
      )}
    </Page>
  );
}
