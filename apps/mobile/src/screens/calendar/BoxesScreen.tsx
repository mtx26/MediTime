import { Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import ContextMenu from '../../components/common/ContextMenu';
import {
  CalendarNotFoundState,
  MedicineBoxCard,
  MedicineBoxQrScannerModal,
} from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { useBoxes } from '../../hooks/calendar';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type BoxesScreenProps = {
  sourceType: Exclude<CalendarDetailSourceType, 'token'>;
};

export default function BoxesScreen({ sourceType }: BoxesScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const boxesView = useBoxes(sourceType);

  const headerOptions = usePageHeaderOptions({
    title: String(t('boxes.title')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
    headerRight: () => (
      <ContextMenu
        actions={boxesView.addActions}
        buttonSize="sm"
        variant="plain"
        onNavigate={() => {}}
      />
    ),
  });

  if (boxesView.loading && boxesView.boxes.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('boxes.loading_medicine_boxes'))} variant="screen" />
      </>
    );
  }

  if (boxesView.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={boxesView.backToCalendars} />
      </>
    );
  }

  return (
    <>
      <Page
        screen={<Stack.Screen options={headerOptions} />}
        refreshControl={(
          <RefreshControl
            refreshing={boxesView.refreshing}
            onRefresh={() => void boxesView.loadBoxes('refresh')}
            tintColor={ios.primary}
            colors={[ios.primary]}
            progressBackgroundColor={ios.card}
          />
        )}
        gap={14}
        withBottomTabInset
      >
        {boxesView.error ? (
          <YStack style={{ gap: 10 }}>
            <InfoBanner iconName="warning-outline" text={boxesView.error} tone="warning" />
            <OutlineButton label={String(t('retry'))} onPress={() => void boxesView.loadBoxes('refresh')} />
          </YStack>
        ) : null}

        {boxesView.hasLowStock ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              hapticSelection();
              boxesView.navigateToStockAlerts();
            }}
          >
            <InfoBanner iconName="warning-outline" text={String(t('stock_alert'))} tone="warning" />
          </Pressable>
        ) : null}

        {boxesView.boxes.length === 0 ? (
          <InfoBanner iconName="medkit-outline" text={String(t('no_medicines'))} />
        ) : (
          <YStack style={{ gap: 10 }}>
            {boxesView.boxes.map((box) => (
              <MedicineBoxCard
                key={box.id}
                actions={boxesView.getBoxActions(box)}
                box={box}
                disabled={boxesView.mutatingBoxId === box.id}
                expanded={Boolean(boxesView.expandedBoxes[box.id])}
                mode="full"
                onMissingPillbox={boxesView.navigateToMissingPillbox}
                onRestock={boxesView.restockBox}
                onToggleExpanded={() => boxesView.toggleExpanded(box.id)}
              />
            ))}
          </YStack>
        )}

      </Page>

      <MedicineBoxQrScannerModal
        disabled={Boolean(boxesView.mutatingBoxId)}
        loadingGtin={boxesView.qrLoadingGtin}
        medicines={boxesView.qrMedicines}
        onBarcodeScanned={boxesView.handleQrBarcodeScanned}
        onCancel={boxesView.closeQrScanner}
        onRemoveMedicine={boxesView.removeQrMedicine}
        onSave={boxesView.saveQrMedicines}
        visible={boxesView.qrScannerOpen}
      />
    </>
  );
}
