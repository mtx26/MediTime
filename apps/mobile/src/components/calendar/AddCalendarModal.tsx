import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';
import type { BarcodeScanningResult } from 'expo-camera';
import type { MedicineReviewMedicineInput, QRScannedMedicine } from '@meditime/types';
import {
  ADD_CALENDAR_IMPORT_TYPES,
  type AddCalendarImportType,
} from '@meditime/constants';
import { InfoBanner } from '../common/InfoBanner';
import { OutlineButton } from '../common/OutlineButton';
import { useAppTheme } from '../../theme/ios';
import type { AddCalendarStep, MedicineReviewField } from './import/types';
import { ImageImportPanel } from './import/ImageImportPanel';
import { ImportTypeOption } from './import/ImportTypeOption';
import { MedicineReviewPanel } from './import/MedicineReviewPanel';
import { QRImportPanel } from './import/QRImportPanel';

type AddCalendarModalProps = {
  open: boolean;
  name: string;
  importType: AddCalendarImportType;
  step: AddCalendarStep;
  disabled: boolean;
  qrMedicines: QRScannedMedicine[];
  qrLoadingGtin: string | null;
  imageAssetUri: string | null;
  imageFileName: string | null;
  importedMedicines: MedicineReviewMedicineInput[];
  medicineReviewIndex: number;
  onNameChange: (value: string) => void;
  onImportTypeChange: (value: AddCalendarImportType) => void;
  onQrBarcodeScanned: (result: BarcodeScanningResult) => void;
  onRemoveQrMedicine: (codeFmd: string | null | undefined) => void;
  onChooseImageSource: () => void;
  onRemoveImage: () => void;
  onMedicineReviewIndexChange: (index: number) => void;
  onMedicineReviewFieldChange: (index: number, field: MedicineReviewField, value: string) => void;
  onRemoveImportedMedicine: (index: number) => void;
  onBackToImport: () => void;
  onSaveImportedMedicines: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function AddCalendarModal({
  open,
  name,
  importType,
  step,
  disabled,
  qrMedicines,
  qrLoadingGtin,
  imageAssetUri,
  imageFileName,
  importedMedicines,
  medicineReviewIndex,
  onNameChange,
  onImportTypeChange,
  onQrBarcodeScanned,
  onRemoveQrMedicine,
  onChooseImageSource,
  onRemoveImage,
  onMedicineReviewIndexChange,
  onMedicineReviewFieldChange,
  onRemoveImportedMedicine,
  onBackToImport,
  onSaveImportedMedicines,
  onCancel,
  onSubmit,
}: AddCalendarModalProps) {
  const { t } = useTranslation();
  const { ios, isDark } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const dragY = useRef(new Animated.Value(0)).current;
  const isManual = importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL;
  const isQr = importType === ADD_CALENDAR_IMPORT_TYPES.QR;
  const isFile = importType === ADD_CALENDAR_IMPORT_TYPES.FILE;
  const canSubmit = Boolean(
    name.trim()
      && (isManual || (isQr && qrMedicines.length > 0) || (isFile && imageFileName)),
  );
  const importDescription =
    isQr
      ? t('calendar.import_type_qr_description')
      : isFile
        ? t('calendar.import_type_file_description')
        : t('calendar.import_type_manual_description');
  const modalMaxHeight = Math.max(420, height - 48);
  const scrollMaxHeight = Math.max(280, modalMaxHeight - 104);
  const isWideLayout = width >= 720;
  const sheetHorizontalPadding = isWideLayout ? 24 : 0;
  const sheetBottomPadding = isWideLayout ? 24 : 0;
  const sheetTranslateY = dragY.interpolate({
    inputRange: [0, modalMaxHeight],
    outputRange: [0, modalMaxHeight],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (open) {
      dragY.stopAnimation();
      dragY.setValue(0);
    }
  }, [dragY, open]);

  const resetSheetPosition = useCallback(() => {
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 0,
    }).start();
  }, [dragY]);

  const closeFromSwipe = useCallback(() => {
    Animated.timing(dragY, {
      toValue: modalMaxHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      dragY.setValue(0);
      if (finished) onCancel();
    });
  }, [dragY, modalMaxHeight, onCancel]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => (
        gestureState.dy > 8
        && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2
      ),
      onPanResponderMove: (_, gestureState) => {
        dragY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 96 || gestureState.vy > 0.85) {
          closeFromSwipe();
          return;
        }

        resetSheetPosition();
      },
      onPanResponderTerminate: resetSheetPosition,
    }),
    [closeFromSwipe, dragY, resetSheetPosition],
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <YStack
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: sheetHorizontalPadding,
          paddingTop: 24,
          paddingBottom: sheetBottomPadding,
          backgroundColor: ios.overlay,
        }}
      >
        <Pressable
          onPress={onCancel}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 672,
            alignSelf: 'center',
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <YStack
            style={{
              width: '100%',
              maxHeight: modalMaxHeight,
              overflow: 'hidden',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: isWideLayout ? 20 : 0,
              borderBottomRightRadius: isWideLayout ? 20 : 0,
              backgroundColor: ios.card,
            }}
          >
            <YStack
              style={{
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 20,
                paddingTop: 10,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: ios.border,
              }}
            >
              <YStack
                {...panResponder.panHandlers}
                style={{
                  width: 72,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <YStack
                  style={{
                    width: 42,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: ios.border,
                  }}
                />
              </YStack>
              <Ionicons name={step === 'review' ? 'pencil-outline' : 'calendar-outline'} size={34} color={ios.primary} />
              <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '800' }}>
                {step === 'review' ? t('medicine_review.title') : t('calendar.add_calendar')}
              </Text>
            </YStack>

            <ScrollView
              style={{ maxHeight: scrollMaxHeight }}
              showsVerticalScrollIndicator
              indicatorStyle={isDark ? 'white' : 'black'}
              keyboardShouldPersistTaps="handled"
              bounces
            >
              {step === 'review' ? (
                <MedicineReviewPanel
                  medicines={importedMedicines}
                  index={medicineReviewIndex}
                  disabled={disabled}
                  onIndexChange={onMedicineReviewIndexChange}
                  onFieldChange={onMedicineReviewFieldChange}
                  onRemoveMedicine={onRemoveImportedMedicine}
                  onBack={onBackToImport}
                  onSave={onSaveImportedMedicines}
                />
              ) : (
                <YStack style={{ gap: 18, padding: 20 }}>
                  <YStack style={{ gap: 8 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, fontWeight: '700' }}>
                      {t('calendar.name')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <Input
                      value={name}
                      onChangeText={onNameChange}
                      disabled={disabled}
                      placeholder={t('calendar.name')}
                      returnKeyType="done"
                      onSubmitEditing={onSubmit}
                      style={{
                        minHeight: 48,
                        borderWidth: 0,
                        borderRadius: 12,
                        backgroundColor: ios.background,
                        color: ios.foreground,
                        fontSize: 17,
                      }}
                    />
                  </YStack>

                  <YStack style={{ gap: 8 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, fontWeight: '700' }}>
                      {t('calendar.import_type')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <YStack style={{ gap: 8 }}>
                      <ImportTypeOption
                        label={t('calendar.import_type_manual')}
                        iconName="add-outline"
                        selected={isManual}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.MANUAL)}
                      />
                      <ImportTypeOption
                        label={t('calendar.scan_qr_option')}
                        iconName="qr-code-outline"
                        selected={isQr}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.QR)}
                      />
                      <ImportTypeOption
                        label={t('calendar.import_type_file')}
                        iconName="cloud-upload-outline"
                        selected={isFile}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.FILE)}
                      />
                    </YStack>
                  </YStack>

                  <InfoBanner
                    iconName={isManual ? 'information-circle-outline' : isQr ? 'qr-code-outline' : 'image-outline'}
                    text={importDescription}
                    tone="info"
                  />

                  {isQr && (
                    <QRImportPanel
                      medicines={qrMedicines}
                      loadingGtin={qrLoadingGtin}
                      disabled={disabled}
                      onBarcodeScanned={onQrBarcodeScanned}
                      onRemoveMedicine={onRemoveQrMedicine}
                    />
                  )}

                  {isFile && (
                    <ImageImportPanel
                      fileName={imageFileName}
                      imageUri={imageAssetUri}
                      disabled={disabled}
                      onChooseSource={onChooseImageSource}
                      onRemoveImage={onRemoveImage}
                    />
                  )}

                  <YStack style={{ gap: 10 }}>
                    <Button
                      size="$5"
                      onPress={onSubmit}
                      disabled={disabled || !canSubmit}
                      style={{
                        minHeight: 50,
                        borderRadius: 14,
                        backgroundColor: ios.primary,
                        opacity: disabled || !canSubmit ? 0.55 : 1,
                      }}
                    >
                      <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {disabled ? (
                          <Spinner size="small" color={ios.primaryForeground} />
                        ) : (
                          <Ionicons name={isFile ? 'arrow-forward' : 'add-outline'} size={19} color={ios.primaryForeground} />
                        )}
                        <Text style={{ color: ios.primaryForeground, fontSize: 17, fontWeight: '800' }}>
                          {isFile ? t('next') : t('add')}
                        </Text>
                      </XStack>
                    </Button>
                    <OutlineButton label={t('cancel')} onPress={onCancel} />
                  </YStack>
                </YStack>
              )}
            </ScrollView>
          </YStack>
        </Animated.View>
      </YStack>
    </Modal>
  );
}
