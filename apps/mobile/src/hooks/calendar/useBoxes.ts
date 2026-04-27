import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  buildBoxActions,
  extractGTIN01,
  fetchMedicamentsFromSupabase,
} from '@meditime/utils';
import type {
  ApiResult,
  BoxesViewBoxItem,
  CalendarBoxInput,
  CalendarDetailSourceType,
  EditingBoxState,
  EditableCondition,
  QRScannedMedicine,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';
import { dismissToCalendars } from './navigation';
import { openPdfUrl, toActionSheetItems } from '../../utils';

type BoxesSource = {
  createBox: (
    calendarId: string,
    name: string,
    boxCapacity: number,
    stockAlertThreshold: number,
    stockQuantity: number,
    dose: number | string | null,
    conditions: EditableCondition[],
    codeFmd?: string | null,
  ) => Promise<ApiResult>;
  deleteBox: (calendarId: string, boxId: string) => Promise<ApiResult>;
  fetchBoxes: (calendarId: string) => Promise<ApiResult>;
  restockBox: (calendarId: string, boxId: string) => Promise<ApiResult>;
  updateBox: (calendarId: string, boxId: string, box: Partial<CalendarBoxInput>) => Promise<ApiResult>;
};

type BoxesResult = ApiResult & {
  boxes?: BoxesViewBoxItem[];
  status?: number;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toEditingBox(box: BoxesViewBoxItem): EditingBoxState {
  return {
    name: box.name,
    dose: box.dose ?? null,
    box_capacity: box.box_capacity,
    stock_alert_threshold: box.stock_alert_threshold,
    stock_quantity: box.stock_quantity,
    code_fmd: box.code_fmd ?? null,
    conditions: (box.conditions ?? []).reduce<Record<string, EditableCondition | undefined>>((acc, condition) => {
      acc[condition.id] = condition;
      return acc;
    }, {}),
  };
}

function getConditions(editingBox: EditingBoxState) {
  return Object.values(editingBox.conditions ?? {}).filter((condition): condition is EditableCondition => Boolean(condition));
}

export function useBoxes(sourceType: Exclude<CalendarDetailSourceType, 'token'>) {
  const { calendarId } = useLocalSearchParams<{ calendarId?: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { apiUrl, personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();
  const basePath = sourceType === 'personal' ? 'calendar' : 'shared-user-calendar';
  const lng = i18n.language || 'fr';

  const [boxes, setBoxes] = useState<BoxesViewBoxItem[]>([]);
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutatingBoxId, setMutatingBoxId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [editingBox, setEditingBox] = useState<EditingBoxState | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrMedicines, setQrMedicines] = useState<QRScannedMedicine[]>([]);
  const [qrScannedCodes, setQrScannedCodes] = useState<string[]>([]);
  const [qrLoadingGtin, setQrLoadingGtin] = useState<string | null>(null);

  const source: BoxesSource = useMemo(
    () => sourceType === 'personal'
      ? {
          createBox: personalCalendarsApi.createPersonalBox,
          deleteBox: personalCalendarsApi.deletePersonalBox,
          fetchBoxes: personalCalendarsApi.fetchPersonalBoxes,
          restockBox: personalCalendarsApi.personalRestockBox,
          updateBox: personalCalendarsApi.updatePersonalBox,
        }
      : {
          createBox: sharedUserCalendarsApi.createSharedUserBox,
          deleteBox: sharedUserCalendarsApi.deleteSharedUserBox,
          fetchBoxes: sharedUserCalendarsApi.fetchSharedUserBoxes,
          restockBox: sharedUserCalendarsApi.sharedUserRestockBox,
          updateBox: sharedUserCalendarsApi.updateSharedUserBox,
        },
    [personalCalendarsApi, sharedUserCalendarsApi, sourceType],
  );

  const loadBoxes = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await source.fetchBoxes(calendarId) as BoxesResult;

      if (result.success) {
        setBoxes(result.boxes ?? []);
        setNotFound(false);
        return;
      }

      if (result.status === 404) {
        setNotFound(true);
        return;
      }

      setError(result.error ?? String(t('api.boxes.fetch_error')));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t('api.boxes.fetch_error')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarId, source, t]);

  useFocusEffect(
    useCallback(() => {
      void loadBoxes();
    }, [loadBoxes]),
  );

  const startEdit = useCallback((box: BoxesViewBoxItem) => {
    setEditingBoxId(box.id);
    setEditingBox(toEditingBox(box));
  }, []);

  const startCreate = useCallback((medicineData: Partial<BoxesViewBoxItem | QRScannedMedicine> = {}) => {
    setEditingBoxId(`temp-${Date.now()}`);
    setEditingBox({
      name: medicineData.name ?? '',
      dose: medicineData.dose ?? 0,
      box_capacity: medicineData.box_capacity ?? 0,
      stock_alert_threshold: medicineData.stock_alert_threshold ?? 10,
      stock_quantity: medicineData.stock_quantity ?? 0,
      code_fmd: medicineData.code_fmd ?? null,
      conditions: {},
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingBoxId(null);
    setEditingBox(null);
  }, []);

  const saveEditingBox = useCallback(async () => {
    if (!calendarId || !editingBox || !editingBoxId) return;

    const name = editingBox.name.trim();
    if (!name) {
      Alert.alert(String(t('error')), String(t('boxes.name')));
      return;
    }

    setMutatingBoxId(editingBoxId);
    try {
      const conditions = getConditions(editingBox);
      const payload = {
        name,
        dose: editingBox.dose === null ? null : toNumber(editingBox.dose),
        box_capacity: toNumber(editingBox.box_capacity),
        stock_alert_threshold: toNumber(editingBox.stock_alert_threshold),
        stock_quantity: toNumber(editingBox.stock_quantity),
        code_fmd: editingBox.code_fmd,
        conditions,
      };

      const result = editingBoxId.startsWith('temp-')
        ? await source.createBox(
            calendarId,
            payload.name,
            payload.box_capacity,
            payload.stock_alert_threshold,
            payload.stock_quantity,
            payload.dose,
            conditions,
            payload.code_fmd,
          )
        : await source.updateBox(calendarId, editingBoxId, payload);

      if (result.success) {
        cancelEdit();
        await loadBoxes('refresh');
        return;
      }

      Alert.alert(String(t('error')), result.error ?? String(t('api.boxes.save_error')));
    } finally {
      setMutatingBoxId(null);
    }
  }, [calendarId, cancelEdit, editingBox, editingBoxId, loadBoxes, source, t]);

  const restockBox = useCallback(async (boxId: string) => {
    if (!calendarId) return;

    setMutatingBoxId(boxId);
    try {
      const result = await source.restockBox(calendarId, boxId);
      if (result.success) {
        await loadBoxes('refresh');
        return;
      }

      Alert.alert(String(t('error')), result.error ?? String(t('api.boxes.refill_error')));
    } finally {
      setMutatingBoxId(null);
    }
  }, [calendarId, loadBoxes, source, t]);

  const confirmDeleteBox = useCallback((box: BoxesViewBoxItem) => {
    if (!calendarId) return;

    Alert.alert(
      String(t('boxes.delete_title')),
      String(t('boxes.delete_description')),
      [
        { text: String(t('cancel')), style: 'cancel' },
        {
          text: String(t('delete')),
          style: 'destructive',
          onPress: () => {
            setMutatingBoxId(box.id);
            void source.deleteBox(calendarId, box.id)
              .then(async (result) => {
                if (result.success) {
                  await loadBoxes('refresh');
                  return;
                }
                Alert.alert(String(t('error')), result.error ?? String(t('api.boxes.delete_error')));
              })
              .finally(() => setMutatingBoxId(null));
          },
        },
      ],
    );
  }, [calendarId, loadBoxes, source, t]);

  const openQrScanner = useCallback(() => {
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
    setQrScannerOpen(true);
  }, []);

  const closeQrScanner = useCallback(() => {
    setQrScannerOpen(false);
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
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

    setQrScannedCodes((current) => [...current, gtin]);
    setQrLoadingGtin(gtin);

    try {
      const medicines = await fetchMedicamentsFromSupabase({
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        codeFmd: gtin,
      });
      const medicine = medicines[0];

      if (!medicine) {
        setQrScannedCodes((current) => current.filter((code) => code !== gtin));
        Alert.alert(String(t('image_upload.no_medicines_found')), gtin);
        return;
      }

      const dose = toNumber(medicine.dose);
      const boxCapacity = toNumber(medicine.conditionnement);

      setQrMedicines((current) => [
        ...current,
        {
          name: medicine.name || 'Unknown',
          dose,
          box_capacity: boxCapacity,
          stock_quantity: boxCapacity,
          stock_alert_threshold: 10,
          code_fmd: gtin,
        },
      ]);
    } catch (err) {
      setQrScannedCodes((current) => current.filter((code) => code !== gtin));
      Alert.alert(
        String(t('scanner.add_all_error')),
        err instanceof Error ? err.message : String(t('scanner.add_all_error')),
      );
    } finally {
      setQrLoadingGtin(null);
    }
  }, [qrLoadingGtin, qrScannedCodes, t]);

  const removeQrMedicine = useCallback((codeFmd: string | null | undefined) => {
    setQrMedicines((current) => current.filter((medicine) => medicine.code_fmd !== codeFmd));
    if (codeFmd) {
      setQrScannedCodes((current) => current.filter((code) => code !== codeFmd));
    }
  }, []);

  const saveQrMedicines = useCallback(async () => {
    if (!calendarId || qrMedicines.length === 0) return;

    if (qrMedicines.length === 1) {
      startCreate(qrMedicines[0]);
      closeQrScanner();
      return;
    }

    setMutatingBoxId('qr-import');
    try {
      let errorCount = 0;

      for (const medicine of qrMedicines) {
        const result = await source.createBox(
          calendarId,
          medicine.name,
          medicine.box_capacity,
          medicine.stock_alert_threshold,
          medicine.stock_quantity,
          medicine.dose,
          [],
          medicine.code_fmd ?? null,
        );

        if (!result.success) errorCount += 1;
      }

      closeQrScanner();
      await loadBoxes('refresh');

      if (errorCount > 0) {
        Alert.alert(String(t('error')), String(t('calendar.error_partial_success', { count: errorCount })));
      }
    } finally {
      setMutatingBoxId(null);
    }
  }, [calendarId, closeQrScanner, loadBoxes, qrMedicines, source, startCreate, t]);

  const openNotice = useCallback((boxId: string) => {
    void openPdfUrl(`${apiUrl}/api/proxy/pdf/${boxId}`).catch(() => {
      Alert.alert(String(t('error')), String(t('api.calendar.pdf_download_error')));
    });
  }, [apiUrl, t]);

  const navigateToMissingPillbox = useCallback((boxId: string) => {
    if (!calendarId) return;

    const medsIdParam = encodeURIComponent(JSON.stringify([boxId]));
    router.push(`/calendars/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}` as never);
  }, [basePath, calendarId, router]);

  const navigateToStockAlerts = useCallback(() => {
    if (!calendarId) return;
    router.push(`/calendars/${basePath}/${calendarId}/stock-alerts` as never);
  }, [basePath, calendarId, router]);

  const toggleExpanded = useCallback((boxId: string) => {
    setExpandedBoxes((current) => ({
      ...current,
      [boxId]: !current[boxId],
    }));
  }, []);

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const getBoxActions = useCallback((box: BoxesViewBoxItem) => toActionSheetItems(
    buildBoxActions(
      {
        onScanQr: () => undefined,
        onEdit: () => startEdit(box),
        onViewNotice: () => openNotice(box.id),
        onDelete: () => confirmDeleteBox(box),
      },
      ['scan_qr'],
    ),
    translate,
  ), [confirmDeleteBox, openNotice, startEdit, translate]);

  const hasLowStock = useMemo(
    () => boxes.some((box) => box.stock_alert_threshold > 0 && box.stock_quantity <= box.stock_alert_threshold),
    [boxes],
  );

  return {
    backToCalendars: () => dismissToCalendars(router),
    boxes,
    cancelEdit,
    editingBox,
    editingBoxId,
    error,
    expandedBoxes,
    getBoxActions,
    handleQrBarcodeScanned,
    hasLowStock,
    loadBoxes,
    loading,
    mutatingBoxId,
    navigateToMissingPillbox,
    navigateToStockAlerts,
    notFound,
    openQrScanner,
    qrLoadingGtin,
    qrMedicines,
    qrScannerOpen,
    refreshing,
    removeQrMedicine,
    restockBox,
    saveEditingBox,
    saveQrMedicines,
    setEditingBox,
    closeQrScanner,
    startCreate,
    toggleExpanded,
    lng,
  };
}
