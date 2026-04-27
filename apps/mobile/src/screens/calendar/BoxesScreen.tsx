import { Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import {
  CalendarNotFoundState,
  MedicineBoxCard,
  MedicineBoxEditorModal,
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

        <YStack style={{ gap: 10, marginTop: 4 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(t('boxes.add_manual'))}
            onPress={() => {
              hapticSelection();
              boxesView.startCreate();
            }}
          >
            {({ pressed }) => (
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  minHeight: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  opacity: pressed ? 0.84 : 1,
                }}
              >
                <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="add-circle-outline" size={20} color={ios.success} />
                  <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 21, fontWeight: '900' }}>
                    {t('boxes.add_manual')}
                  </Text>
                </XStack>
              </GlassView>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(t('boxes.add_with_qr'))}
            onPress={() => {
              hapticSelection();
              boxesView.openQrScanner();
            }}
          >
            {({ pressed }) => (
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  minHeight: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  opacity: pressed ? 0.84 : 1,
                }}
              >
                <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="qr-code-outline" size={20} color={ios.primary} />
                  <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 21, fontWeight: '900' }}>
                    {t('boxes.add_with_qr')}
                  </Text>
                </XStack>
              </GlassView>
            )}
          </Pressable>
        </YStack>
      </Page>

      <MedicineBoxEditorModal
        disabled={Boolean(boxesView.mutatingBoxId)}
        editingBox={boxesView.editingBox}
        editingBoxId={boxesView.editingBoxId}
        onCancel={boxesView.cancelEdit}
        onChange={boxesView.setEditingBox}
        onSave={boxesView.saveEditingBox}
      />
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
