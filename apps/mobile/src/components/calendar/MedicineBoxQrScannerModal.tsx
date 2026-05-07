import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { BarcodeScanningResult } from 'expo-camera';
import type { QRScannedMedicine } from '@meditime/types';
import { LiquidButton } from '../common/LiquidButton';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { QRImportPanel } from './import';

type MedicineBoxQrScannerModalProps = {
  disabled?: boolean;
  loadingGtin: string | null;
  medicines: QRScannedMedicine[];
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onCancel: () => void;
  onRemoveMedicine: (codeFmd: string | null | undefined) => void;
  onSave: () => void;
  visible: boolean;
};

export function MedicineBoxQrScannerModal({
  disabled = false,
  loadingGtin,
  medicines,
  onBarcodeScanned,
  onCancel,
  onRemoveMedicine,
  onSave,
  visible,
}: MedicineBoxQrScannerModalProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const canSave = medicines.length > 0;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <YStack style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <YStack style={styles.sheetWrap}>
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="regular"
            style={{
              maxHeight: '100%',
              borderRadius: 28,
              padding: 8,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, padding: 12 }}
            >
              <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <YStack style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 26, fontWeight: '900' }}>
                    {t('boxes.add_with_qr')}
                  </Text>
                  <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 19 }}>
                    {t('boxes.qr_code_help_text')}
                  </Text>
                </YStack>
                <Pressable onPress={onCancel}>
                  {({ pressed }) => (
                    <GlassView
                      colorScheme={colorScheme}
                      glassEffectStyle="regular"
                      style={{
                        width: 32,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        borderWidth: 0.5,
                        borderColor: ios.border,
                        overflow: 'hidden',
                        opacity: pressed ? 0.72 : 1,
                      }}
                    >
                      <Ionicons name="close" size={16} color={ios.primary} />
                    </GlassView>
                  )}
                </Pressable>
              </XStack>

              <QRImportPanel
                disabled={disabled}
                loadingGtin={loadingGtin}
                medicines={medicines}
                onBarcodeScanned={onBarcodeScanned}
                onRemoveMedicine={onRemoveMedicine}
              />

              <LiquidButton
                disabled={disabled || !canSave}
                iconName="checkmark-circle-outline"
                label={String(t('add'))}
                onPress={onSave}
                tone="primary"
              />
            </ScrollView>
          </GlassView>
        </YStack>
      </YStack>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
