import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, Spinner, Text, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
} from '@meditime/utils';
import { OutlineButton } from '../../components/common/OutlineButton';
import {
  AddCalendarFooter,
  CalendarSection,
  PdfDialog,
} from '../../components/calendar';
import { useIosTheme } from '../../theme/ios';
import { useAddCalendar, useCalendars } from '../../hooks/calendars';
import { openPdfUrl, toActionSheetItems, toMobileHref } from '../../utils';

const AddCalendarModal = lazy(() =>
  import('../../components/calendar/AddCalendarModal').then((module) => ({
    default: module.AddCalendarModal,
  })),
);

export default function CalendarsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const lng = i18n.language || 'fr';
  const bottomContentInset = 56 + insets.bottom + 14;
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [renameMode, setRenameMode] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfCalendarId, setPdfCalendarId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const calendars = useCalendars();
  const {
    personalCalendars,
    sharedCalendars,
    isLoading,
    isMutating,
    error,
    loadCalendars,
    deleteCalendar,
    renameCalendar,
    deleteSharedCalendar,
    getPersonalCalendarPdfUrl,
  } = calendars;

  const addCalendarFlow = useAddCalendar({
    addCalendar: calendars.addCalendar,
    analyzeImageBase64: calendars.analyzeImageBase64,
    createPersonalBox: calendars.createPersonalBox,
    isMutating,
    loadCalendars,
    saveAnalysisResult: calendars.saveAnalysisResult,
  });

  useEffect(() => {
    void loadCalendars();
  }, [loadCalendars]);

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const navigateToHref = useCallback(
    (href: string) => {
      router.push(toMobileHref(href) as never);
    },
    [router],
  );

  const openPdfDialog = (calendarId: string) => {
    setPdfCalendarId(calendarId);
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  };

  const openCalendarPdf = async () => {
    if (!pdfCalendarId) return;

    const url = getPersonalCalendarPdfUrl(pdfCalendarId, includeInactive);
    try {
      await openPdfUrl(url);
      setPdfDialogOpen(false);
    } catch {
      Alert.alert(String(t('api.calendar.pdf_download_error')), String(t('api.calendar.pdf_download_error')));
    }
  };

  const handleRenameSubmit = (calendar: CalendarItem) => {
    const nextName = (renameValues[calendar.id] ?? '').trim();
    if (!nextName) return;

    Alert.alert(
      String(t('calendar.rename_title')),
      String(t('calendar.rename_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('rename')),
          onPress: () => {
            void renameCalendar(calendar.id, nextName).then((result) => {
              if (result.success) {
                setRenameValues((prev) => ({ ...prev, [calendar.id]: '' }));
                setRenameMode(null);
                return;
              }
              Alert.alert(String(t('api.calendar.rename_error')), result.error ?? String(t('api.calendar.rename_error')));
            });
          },
        },
      ],
    );
  };

  const handleDeleteCalendarClick = (calendarId: string) => {
    Alert.alert(
      String(t('calendar.delete_title')),
      String(t('calendar.delete_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void deleteCalendar(calendarId);
          },
        },
      ],
    );
  };

  const handleDeleteSharedCalendarClick = (calendarId: string) => {
    Alert.alert(
      String(t('calendar.delete_shared_title')),
      String(t('calendar.delete_shared_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            void deleteSharedCalendar(calendarId);
          },
        },
      ],
    );
  };

  const getPersonalActions = (calendar: CalendarItem) => {
    return toActionSheetItems(
      buildPersonalCalendarActions(
        { calendarId: calendar.id, lng, basePath: 'calendar', selectedDate: null },
        {
          onRename: () => setRenameMode(calendar.id),
          onDelete: () => handleDeleteCalendarClick(calendar.id),
          onExportPdf: () => openPdfDialog(calendar.id),
        },
        ['pillbox', 'day_view'],
      ),
      translate,
    );
  };

  const getSharedActions = (calendar: CalendarItem) => {
    return toActionSheetItems(
      buildSharedCalendarActions(
        { calendarId: calendar.id, lng, basePath: 'shared-user-calendar', selectedDate: null },
        {
          onDelete: () => handleDeleteSharedCalendarClick(calendar.id),
          onExportPdf: () => openPdfDialog(calendar.id),
        },
        ['pillbox', 'day_view'],
      ),
      translate,
    );
  };

  const openPersonalCalendar = (calendar: CalendarItem) => {
    router.push(`/calendars/calendar/${calendar.id}` as never);
  };

  const openSharedCalendar = (calendar: CalendarItem) => {
    router.push(`/calendars/shared-user-calendar/${calendar.id}` as never);
  };

  if (isLoading && personalCalendars.length === 0 && sharedCalendars.length === 0) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background, gap: 12 }}>
        <Spinner size="large" color={ios.primary} />
        <Text style={{ color: ios.mutedForeground, fontWeight: '700' }}>{t('loading_calendars')}</Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={(
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCalendars}
            tintColor={ios.primary}
            colors={[ios.primary]}
            progressBackgroundColor={ios.card}
          />
        )}
      >
        <YStack
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: bottomContentInset,
            backgroundColor: ios.background,
          }}
        >
          {error && (
            <YStack
              style={{
                width: '100%',
                maxWidth: 672,
                gap: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: ios.destructiveBorder,
                borderRadius: 8,
                backgroundColor: ios.destructiveBg,
              }}
            >
              <Text style={{ color: ios.destructive, fontWeight: '700' }}>{error}</Text>
              <OutlineButton label={String(t('retry'))} onPress={loadCalendars} />
            </YStack>
          )}

          <CalendarSection
            title={String(t('my_calendars'))}
            iconName="calendar-outline"
            calendars={personalCalendars}
            getActions={getPersonalActions}
            onOpen={openPersonalCalendar}
            onNavigate={navigateToHref}
            renameMode={renameMode}
            renameValues={renameValues}
            isMutating={isMutating}
            onRenameChange={(calendarId, value) =>
              setRenameValues((prev) => ({ ...prev, [calendarId]: value }))
            }
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenameMode(null)}
            addFooter={<AddCalendarFooter onPress={addCalendarFlow.openModal} />}
          />

          <CalendarSection
            title={String(t('shared_calendars'))}
            iconName="people-outline"
            calendars={sharedCalendars}
            emptyText={String(t('no_shared_calendars'))}
            showInfoEmpty
            getActions={getSharedActions}
            onOpen={openSharedCalendar}
            onNavigate={navigateToHref}
          />
        </YStack>
      </ScrollView>

      <Suspense fallback={null}>
        <AddCalendarModal
          open={addCalendarFlow.open}
          name={addCalendarFlow.calendarName}
          importType={addCalendarFlow.importType}
          step={addCalendarFlow.step}
          disabled={addCalendarFlow.isBusy}
          qrMedicines={addCalendarFlow.qrMedicines}
          qrLoadingGtin={addCalendarFlow.qrLoadingGtin}
          imageAssetUri={addCalendarFlow.imageAssetUri}
          imageFileName={addCalendarFlow.imageFileName}
          importedMedicines={addCalendarFlow.importedMedicines}
          medicineReviewIndex={addCalendarFlow.medicineReviewIndex}
          onNameChange={addCalendarFlow.setCalendarName}
          onImportTypeChange={addCalendarFlow.changeImportType}
          onQrBarcodeScanned={addCalendarFlow.handleQrBarcodeScanned}
          onRemoveQrMedicine={addCalendarFlow.removeQrMedicine}
          onChooseCamera={addCalendarFlow.chooseCamera}
          onChooseFile={addCalendarFlow.chooseFile}
          onChooseLibrary={addCalendarFlow.chooseLibrary}
          onRemoveImage={addCalendarFlow.removeImage}
          onMedicineReviewIndexChange={addCalendarFlow.setMedicineReviewIndex}
          onMedicineReviewFieldChange={addCalendarFlow.changeReviewField}
          onRemoveImportedMedicine={addCalendarFlow.removeImportedMedicine}
          onBackToImport={addCalendarFlow.backToImport}
          onSaveImportedMedicines={() => void addCalendarFlow.saveImportedMedicines()}
          onCancel={addCalendarFlow.cancel}
          onSubmit={() => void addCalendarFlow.submit()}
        />
      </Suspense>

      <PdfDialog
        open={pdfDialogOpen}
        includeInactive={includeInactive}
        onIncludeInactiveChange={setIncludeInactive}
        onCancel={() => setPdfDialogOpen(false)}
        onDownload={() => void openCalendarPdf()}
      />
    </>
  );
}
