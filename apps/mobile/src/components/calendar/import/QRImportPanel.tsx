import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import type { QRScannedMedicine } from '@meditime/types';
import { IconButton } from '../../common/IconButton';
import { NativeLoadingSpinner } from '../../common/NativeLoadingSpinner';
import { OutlineButton } from '../../common/OutlineButton';
import { useAppTheme, useIosTheme } from '../../../theme/ios';

type QRImportPanelProps = {
  medicines: QRScannedMedicine[];
  loadingGtin: string | null;
  disabled: boolean;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onRemoveMedicine: (codeFmd: string | null | undefined) => void;
};

export function QRImportPanel({
  medicines,
  loadingGtin,
  disabled,
  onBarcodeScanned,
  onRemoveMedicine,
}: QRImportPanelProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted;

  return (
    <YStack style={{ gap: 12 }}>
      <YStack
        style={{
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: ios.border,
          backgroundColor: '#000',
          height: 240,
        }}
      >
        {hasPermission ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['datamatrix', 'qr'] }}
            onBarcodeScanned={disabled || loadingGtin ? undefined : onBarcodeScanned}
          />
        ) : (
          <YStack
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 20,
              backgroundColor: ios.background,
            }}
          >
            <Ionicons name="camera-outline" size={30} color={ios.primary} />
            <Text style={{ textAlign: 'center', color: ios.foreground, fontWeight: '700' }}>
              {t('scanner.camera_error')}
            </Text>
            <OutlineButton label={t('boxes.scan_qr_code')} onPress={() => void requestPermission()} />
          </YStack>
        )}
      </YStack>

      {loadingGtin && (
        <XStack style={{ alignItems: 'center', gap: 8 }}>
          <NativeLoadingSpinner size="small" />
          <Text style={{ color: ios.mutedForeground, fontWeight: '700' }}>
            {loadingGtin}
          </Text>
        </XStack>
      )}

      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{
          borderRadius: 24,
          padding: 8,
        }}
      >
        <YStack>
          {medicines.length === 0 ? (
            <YStack style={{ alignItems: 'center', gap: 8, padding: 8 }}>
              <Ionicons name="qr-code-outline" size={24} color={ios.mutedForeground} />
              <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontWeight: '700' }}>
                {t('calendar.error_no_medicines')}
              </Text>
            </YStack>
          ) : (
            medicines.map((medicine, index) => (
              <XStack
                key={`${medicine.code_fmd ?? medicine.name}-${index}`}
                style={{
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  borderBottomWidth: index === medicines.length - 1 ? 0 : 1,
                  borderBottomColor: ios.border,
                }}
              >
                <YStack style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ color: ios.foreground, fontSize: 16, fontWeight: '800' }}>
                    {medicine.name}
                  </Text>
                  <Text style={{ color: ios.mutedForeground, fontSize: 13, marginTop: 2 }}>
                    {medicine.dose ?? 0} mg - {medicine.stock_quantity}/{medicine.box_capacity}
                  </Text>
                </YStack>
                <IconButton
                  label={t('boxes.condition.delete')}
                  iconName="trash-outline"
                  disabled={disabled}
                  onPress={() => onRemoveMedicine(medicine.code_fmd)}
                />
              </XStack>
            ))
          )}
        </YStack>
      </GlassView>
    </YStack>
  );
}
