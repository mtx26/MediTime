import { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, Stack, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Input, Text, XStack, YStack } from 'tamagui';
import { ADD_CALENDAR_IMPORT_TYPES } from '@meditime/constants';
import { BackButton } from '../../components/common/BackButton';
import { LiquidButton } from '../../components/common/LiquidButton';
import { MobileForm } from '../../components/common/MobileForm';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import {
  ImageImportPanel,
  ImportTypeOption,
  MedicineReviewPanel,
  QRImportPanel,
} from '../../components/calendar/import';
import { useAddCalendar, useCalendars } from '../../hooks/calendars';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAppTheme } from '../../theme/ios';
import { hapticImpact, hapticSelection } from '../../utils/haptics';

export default function AddCalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { colorScheme, ios, isDark } = useAppTheme();
  const calendars = useCalendars();
  const [imageSourceMenuOpen, setImageSourceMenuOpen] = useState(false);
  const addCalendar = useAddCalendar({
    addCalendar: calendars.addCalendar,
    analyzeImageBase64: calendars.analyzeImageBase64,
    createPersonalBox: calendars.createPersonalBox,
    isMutating: calendars.isMutating,
    loadCalendars: calendars.loadCalendars,
    saveAnalysisResult: calendars.saveAnalysisResult,
  });
  const isManual = addCalendar.importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL;
  const isQr = addCalendar.importType === ADD_CALENDAR_IMPORT_TYPES.QR;
  const isFile = addCalendar.importType === ADD_CALENDAR_IMPORT_TYPES.FILE;
  const canSubmit = Boolean(
    addCalendar.calendarName.trim()
      && (isManual || (isQr && addCalendar.qrMedicines.length > 0) || (isFile && addCalendar.imageFileName)),
  );
  const importDescription =
    isQr
      ? t('calendar.import_type_qr_description')
      : isFile
        ? t('calendar.import_type_file_description')
        : t('calendar.import_type_manual_description');
  const headerOptions = usePageHeaderOptions({
    title: String(t('calendar.add_calendar')),
    headerLeft: () => <BackButton fallbackHref="/calendars" variant="header" />,
    headerBackTitleVisible: false,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios' || !imageSourceMenuOpen) return;

    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    const options = [
      String(t('image_upload.take_photo')),
      String(t('image_upload.choose_from_library')),
      String(t('image_upload.choose_file')),
      String(t('cancel')),
    ];
    const cancelButtonIndex = options.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: String(t('calendar.choose_image')),
        options,
        cancelButtonIndex,
        userInterfaceStyle: isDark ? 'dark' : 'light',
      },
      (buttonIndex) => {
        setImageSourceMenuOpen(false);

        if (buttonIndex === cancelButtonIndex) {
          hapticSelection();
          return;
        }

        hapticImpact(Haptics.ImpactFeedbackStyle.Light);
        if (buttonIndex === 0) addCalendar.chooseCamera();
        if (buttonIndex === 1) addCalendar.chooseLibrary();
        if (buttonIndex === 2) addCalendar.chooseFile();
      },
    );
  }, [addCalendar, imageSourceMenuOpen, isDark, t]);

  const close = useCallback(() => {
    addCalendar.cancel();
    router.back();
  }, [addCalendar, router]);

  const submit = useCallback(async () => {
    const success = await addCalendar.submit();
    if (success) {
      router.replace('/calendars' as never);
    }
  }, [addCalendar, router]);

  const saveImportedMedicines = useCallback(async () => {
    const success = await addCalendar.saveImportedMedicines();
    if (success) {
      router.replace('/calendars' as never);
    }
  }, [addCalendar, router]);

  if (isAuthLoading) {
    return null;
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      gap={18}
      contentContainerStyle={{ width: '100%', maxWidth: 672, alignSelf: 'center' }}
    >
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{
          borderRadius: 24,
          padding: 8,
        }}
      >
        <YStack style={{ gap: 18, padding: 8 }}>
          <YStack style={{ gap: 6 }}>
            <XStack style={{ alignItems: 'center', gap: 10 }}>
              <Ionicons name="calendar-outline" size={24} color={ios.primary} />
              <Text style={{ flex: 1, color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
                {t('calendar.add_calendar')}
              </Text>
            </XStack>
            <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>
              {importDescription}
            </Text>
          </YStack>

          {addCalendar.step === 'review' ? (
            <MedicineReviewPanel
              medicines={addCalendar.importedMedicines}
              index={addCalendar.medicineReviewIndex}
              disabled={addCalendar.isBusy}
              onIndexChange={addCalendar.setMedicineReviewIndex}
              onFieldChange={addCalendar.changeReviewField}
              onRemoveMedicine={addCalendar.removeImportedMedicine}
              onBack={addCalendar.backToImport}
              onSave={() => void saveImportedMedicines()}
            />
          ) : (
            <MobileForm
              onSubmit={submit}
              disabled={addCalendar.isBusy || !canSubmit}
              style={{ gap: 18 }}
            >
              {(form) => (
                <>
                  <YStack style={{ gap: 8 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, fontWeight: '700' }}>
                      {t('calendar.name')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <Input
                      value={addCalendar.calendarName}
                      onChangeText={addCalendar.setCalendarName}
                      disabled={addCalendar.isBusy}
                      placeholder={t('calendar.name')}
                      {...form.getInputProps()}
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
                        description={t('calendar.import_type_manual_description')}
                        iconName="add-outline"
                        selected={isManual}
                        onPress={() => addCalendar.changeImportType(ADD_CALENDAR_IMPORT_TYPES.MANUAL)}
                      />
                      <ImportTypeOption
                        label={t('calendar.scan_qr_option')}
                        description={t('calendar.import_type_qr_description')}
                        iconName="qr-code-outline"
                        selected={isQr}
                        onPress={() => addCalendar.changeImportType(ADD_CALENDAR_IMPORT_TYPES.QR)}
                      />
                      <ImportTypeOption
                        label={t('calendar.import_type_file')}
                        description={t('calendar.import_type_file_description')}
                        iconName="cloud-upload-outline"
                        selected={isFile}
                        onPress={() => addCalendar.changeImportType(ADD_CALENDAR_IMPORT_TYPES.FILE)}
                      />
                    </YStack>
                  </YStack>

                  {isQr && (
                    <QRImportPanel
                      medicines={addCalendar.qrMedicines}
                      loadingGtin={addCalendar.qrLoadingGtin}
                      disabled={addCalendar.isBusy}
                      onBarcodeScanned={addCalendar.handleQrBarcodeScanned}
                      onRemoveMedicine={addCalendar.removeQrMedicine}
                    />
                  )}

                  {isFile && (
                    <ImageImportPanel
                      fileName={addCalendar.imageFileName}
                      imageUri={addCalendar.imageAssetUri}
                      disabled={addCalendar.isBusy}
                      onChooseSource={() => {
                        if (Platform.OS === 'ios') {
                          setImageSourceMenuOpen(true);
                          return;
                        }
                        addCalendar.chooseFile();
                      }}
                      onRemoveImage={addCalendar.removeImage}
                    />
                  )}

                  <YStack style={{ gap: 10 }}>
                    <LiquidButton
                      label={isFile ? t('next') : t('add')}
                      iconName={isFile ? 'arrow-forward' : 'add-outline'}
                      loading={addCalendar.isBusy}
                      tone="primary"
                      onPress={form.submit}
                      disabled={addCalendar.isBusy || !canSubmit}
                    />
                    <OutlineButton label={t('cancel')} onPress={close} />
                  </YStack>
                </>
              )}
            </MobileForm>
          )}
        </YStack>
      </GlassView>
    </Page>
  );
}
