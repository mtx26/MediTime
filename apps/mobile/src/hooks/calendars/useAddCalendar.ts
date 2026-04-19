import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { BarcodeScanningResult } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import type { MedicineReviewMedicineInput, QRScannedMedicine } from '@meditime/types';
import {
  ADD_CALENDAR_IMPORT_TYPES,
  type AddCalendarImportType,
} from '@meditime/constants';
import {
  extractGTIN01,
  fetchMedicamentsFromSupabase,
} from '@meditime/utils';
import type { useCalendars } from './useCalendars';
import type { AddCalendarStep, MedicineReviewField } from '../../components/calendar/import/types';
import { openImageSourceSheet } from '../../components/common/ImageSourceSheet';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.9,
  presentationStyle: ImagePicker.UIImagePickerPresentationStyle.AUTOMATIC,
};

const IMAGE_LIBRARY_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  ...IMAGE_PICKER_OPTIONS,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
};

function parsePositiveInteger(value: string | number | null | undefined, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMedicineReviewInput(medicine: MedicineReviewMedicineInput): MedicineReviewMedicineInput {
  return {
    ...medicine,
    stock_quantity: medicine.stock_quantity ?? '',
    stock_max: medicine.stock_max ?? '',
    stock_alert_threshold: medicine.stock_alert_threshold ?? '',
    conditions: Array.isArray(medicine.conditions) ? medicine.conditions : [],
  };
}

function getApiErrorMessage(result: unknown, fallback: string) {
  const error = typeof result === 'object' && result ? (result as { error?: unknown }).error : null;
  return typeof error === 'string' ? error : fallback;
}

type CalendarsApi = Pick<
  ReturnType<typeof useCalendars>,
  'addCalendar' | 'analyzeImageBase64' | 'createPersonalBox' | 'loadCalendars' | 'saveAnalysisResult'
>;

type UseAddCalendarFlowParams = CalendarsApi & {
  isMutating: boolean;
};

export function useAddCalendar({
  addCalendar,
  analyzeImageBase64,
  createPersonalBox,
  isMutating,
  loadCalendars,
  saveAnalysisResult,
}: UseAddCalendarFlowParams) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [calendarName, setCalendarName] = useState('');
  const [importType, setImportType] = useState<AddCalendarImportType>(ADD_CALENDAR_IMPORT_TYPES.MANUAL);
  const [step, setStep] = useState<AddCalendarStep>('form');
  const [isImporting, setIsImporting] = useState(false);
  const [qrMedicines, setQrMedicines] = useState<QRScannedMedicine[]>([]);
  const [qrScannedCodes, setQrScannedCodes] = useState<string[]>([]);
  const [qrLoadingGtin, setQrLoadingGtin] = useState<string | null>(null);
  const [imageAssetUri, setImageAssetUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [importedMedicines, setImportedMedicines] = useState<MedicineReviewMedicineInput[]>([]);
  const [medicineReviewIndex, setMedicineReviewIndex] = useState(0);

  const reset = useCallback(() => {
    setCalendarName('');
    setImportType(ADD_CALENDAR_IMPORT_TYPES.MANUAL);
    setStep('form');
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const openModal = useCallback(() => setOpen(true), []);

  const cancel = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const setSelectedImage = useCallback((uri: string, fileName?: string | null) => {
    setImageAssetUri(uri);
    setImageFileName(fileName ?? uri.split('/').pop() ?? String(t('image_upload.file_selected')));
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, [t]);

  const changeImportType = useCallback((value: AddCalendarImportType) => {
    setImportType(value);
    setStep('form');
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(String(t('image_upload.select_file_error')), String(t('image_upload.select_file_error')));
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_LIBRARY_PICKER_OPTIONS);

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri, asset.fileName);
    }
  }, [setSelectedImage, t]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(String(t('scanner.camera_error')), String(t('scanner.camera_error')));
      return;
    }

    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri, asset.fileName);
    }
  }, [setSelectedImage, t]);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri, asset.name);
    }
  }, [setSelectedImage]);

  const chooseImageSource = useCallback(() => {
    openImageSourceSheet({
      title: String(t('calendar.choose_image')),
      cameraLabel: String(t('image_upload.take_photo')),
      libraryLabel: String(t('image_upload.choose_from_library')),
      fileLabel: String(t('image_upload.choose_file')),
      cancelLabel: String(t('cancel')),
      onCamera: () => void takePhoto(),
      onLibrary: () => void pickFromLibrary(),
      onFile: () => void pickFile(),
    });
  }, [pickFile, pickFromLibrary, takePhoto, t]);

  const removeImage = useCallback(() => {
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const handleQrBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    const rawCode = result.data?.trim();
    const fallbackGtin = rawCode?.match(/^[0-9]{14}$/)?.[0] ?? null;
    const gtin = rawCode ? extractGTIN01(rawCode) ?? fallbackGtin : null;

    if (!gtin || qrLoadingGtin || qrScannedCodes.includes(gtin)) {
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      Alert.alert(String(t('error')), 'Configuration Supabase manquante.');
      return;
    }

    setQrScannedCodes((prev) => [...prev, gtin]);
    setQrLoadingGtin(gtin);

    try {
      const medicines = await fetchMedicamentsFromSupabase({
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        codeFmd: gtin,
      });
      const medicine = medicines[0];

      if (!medicine) {
        setQrScannedCodes((prev) => prev.filter((code) => code !== gtin));
        Alert.alert(String(t('image_upload.no_medicines_found')), gtin);
        return;
      }

      const dose = parsePositiveInteger(medicine.dose, 0);
      const conditionnement = parsePositiveInteger(medicine.conditionnement, 0);

      setQrMedicines((prev) => [
        ...prev,
        {
          name: medicine.name || 'Unknown',
          dose,
          box_capacity: conditionnement,
          stock_quantity: conditionnement,
          stock_alert_threshold: 10,
          code_fmd: gtin,
        },
      ]);
    } catch (err) {
      setQrScannedCodes((prev) => prev.filter((code) => code !== gtin));
      Alert.alert(
        String(t('scanner.add_all_error')),
        err instanceof Error ? err.message : String(t('scanner.add_all_error')),
      );
    } finally {
      setQrLoadingGtin(null);
    }
  }, [qrLoadingGtin, qrScannedCodes, t]);

  const removeQrMedicine = useCallback((codeFmd: string | null | undefined) => {
    setQrMedicines((prev) => prev.filter((medicine) => medicine.code_fmd !== codeFmd));
    if (codeFmd) {
      setQrScannedCodes((prev) => prev.filter((code) => code !== codeFmd));
    }
  }, []);

  const changeReviewField = useCallback((index: number, field: MedicineReviewField, value: string) => {
    setImportedMedicines((prev) => prev.map((medicine, currentIndex) => (
      currentIndex === index ? { ...medicine, [field]: value } : medicine
    )));
  }, []);

  const removeImportedMedicine = useCallback((index: number) => {
    setImportedMedicines((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      if (next.length === 0) {
        setStep('form');
        setMedicineReviewIndex(0);
      } else if (medicineReviewIndex >= next.length) {
        setMedicineReviewIndex(next.length - 1);
      }
      return next;
    });
  }, [medicineReviewIndex]);

  const saveImportedMedicines = useCallback(async () => {
    const name = calendarName.trim();
    if (!name || importedMedicines.length === 0) return;

    setIsImporting(true);
    try {
      const result = await saveAnalysisResult(name, importedMedicines.map(normalizeMedicineReviewInput));
      if (result.success && result.calendar_id) {
        reset();
        setOpen(false);
        return;
      }

      Alert.alert(
        String(t('image_upload.analysis_error')),
        getApiErrorMessage(result, String(t('image_upload.analysis_error'))),
      );
    } finally {
      setIsImporting(false);
    }
  }, [calendarName, importedMedicines, reset, saveAnalysisResult, t]);

  const submit = useCallback(async () => {
    const name = calendarName.trim();
    if (!name) return;

    setIsImporting(true);

    try {
      if (importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL) {
        const result = await addCalendar(name);
        if (result.success) {
          reset();
          setOpen(false);
          return;
        }

        Alert.alert(String(t('calendar.error_calendar_creation')), getApiErrorMessage(result, String(t('calendar.error_calendar_creation'))));
        return;
      }

      if (importType === ADD_CALENDAR_IMPORT_TYPES.QR) {
        if (qrMedicines.length === 0) {
          Alert.alert(String(t('calendar.error_no_medicines')), String(t('calendar.error_no_medicines')));
          return;
        }

        const calendarResult = await addCalendar(name) as { success: boolean; calendarId?: string; error?: string };
        if (!calendarResult.success || !calendarResult.calendarId) {
          Alert.alert(String(t('calendar.error_calendar_creation')), calendarResult.error ?? String(t('calendar.error_calendar_creation')));
          return;
        }

        let errorCount = 0;
        for (const medicine of qrMedicines) {
          const boxResult = await createPersonalBox(
            calendarResult.calendarId,
            medicine.name,
            medicine.box_capacity,
            medicine.stock_alert_threshold,
            medicine.stock_quantity,
            medicine.dose,
            [],
            medicine.code_fmd ?? null,
          );
          if (!boxResult.success) {
            errorCount += 1;
          }
        }

        await loadCalendars();
        reset();
        setOpen(false);

        if (errorCount > 0) {
          Alert.alert(String(t('calendar.error_partial_success', { count: errorCount })));
        }
        return;
      }

      if (importType === ADD_CALENDAR_IMPORT_TYPES.FILE) {
        if (!imageAssetUri) {
          Alert.alert(String(t('image_upload.select_file_error')), String(t('image_upload.select_file_error')));
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(imageAssetUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const result = await analyzeImageBase64(base64);

        if (result.success && Array.isArray(result.medicines) && result.medicines.length > 0) {
          setImportedMedicines(result.medicines.map(normalizeMedicineReviewInput));
          setMedicineReviewIndex(0);
          setStep('review');
          return;
        }

        Alert.alert(
          String(result.success ? t('image_upload.no_medicines_found') : t('image_upload.analysis_error')),
          getApiErrorMessage(result, ''),
        );
      }
    } finally {
      setIsImporting(false);
    }
  }, [
    addCalendar,
    analyzeImageBase64,
    calendarName,
    createPersonalBox,
    imageAssetUri,
    importType,
    loadCalendars,
    qrMedicines,
    reset,
    t,
  ]);

  return {
    open,
    openModal,
    cancel,
    calendarName,
    setCalendarName,
    importType,
    step,
    isBusy: isMutating || isImporting || Boolean(qrLoadingGtin),
    qrMedicines,
    qrLoadingGtin,
    imageAssetUri,
    imageFileName,
    importedMedicines,
    medicineReviewIndex,
    setMedicineReviewIndex,
    changeImportType,
    chooseImageSource,
    removeImage,
    handleQrBarcodeScanned,
    removeQrMedicine,
    changeReviewField,
    removeImportedMedicine,
    backToImport: () => setStep('form'),
    saveImportedMedicines,
    submit,
  };
}
