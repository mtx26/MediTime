import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useBoxEditing } from '@/hooks/boxes/useBoxEditing';
import { useBoxScanner } from '@/hooks/boxes/useBoxScanner';
import { getConditionFields } from '@/utils/getConditionFields';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, buildPersonalCalendarActions, buildSharedCalendarActions, detectCalendarType } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import type {
  BoxesViewPageProps,
  BoxesViewBoxItem,
} from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';

export function useBoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }: BoxesViewPageProps) {
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const navigate = useNavigate();
  const lng = params.lng;
  const { t } = useTranslation();

  // =========================================================================
  // STATE
  // =========================================================================

  const [boxes, setBoxes] = useState<BoxesViewBoxItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const { showConfirm } = useAlert();
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [rep, setRep] = useState<Response | null>(null);
  const [notFound, setNotFound] = useState(false);

  // =========================================================================
  // CALENDAR DETECTION
  // =========================================================================

  const { calendarType, basePath } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = (getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] || {}) as CalendarSourceGroup;

  const isDemo = calendarId === 'demo';

  // =========================================================================
  // HOOKS
  // =========================================================================

  useRealtimeBoxesSwitcher(
    isDemo ? '' : calendarType,
    calendarId ?? null,
    setBoxes,
    setLoadingBoxes,
    setRep
  );

  const {
    editingBoxId, editingBox, setEditingBox, initEditing, cancelEditing,
    addCondition, deleteCondition, updateCondition, handleSubmit, createTemporaryBox,
  } = useBoxEditing({ calendarSource, calendarId });

  const {
    showQRModal, singleScan, addScannedMedicines, updateScannedMedicine,
    openAddScan, openUpdateScan, closeScanner,
  } = useBoxScanner({ calendarSource, calendarId, boxes, createTemporaryBox });

  const conditionFields = getConditionFields(t);

  useEffect(() => {
    if (rep && rep.status === 404) {
      setNotFound(true);
      setLoadingBoxes(false);
    }
  }, [rep]);

  useEffect(() => {
    if (isDemo) {
      setBoxes([
        {
          id: 'demo-1',
          name: 'Doliprane 1000mg',
          dose: 1000,
          box_capacity: 8,
          stock_quantity: 5,
          stock_alert_threshold: 2,
          conditions: [],
        },
        {
          id: 'demo-2',
          name: 'Amoxicilline',
          dose: 500,
          box_capacity: 12,
          stock_quantity: 1,
          stock_alert_threshold: 3,
          conditions: [],
        },
        {
          id: 'demo-3',
          name: 'Vitamin C',
          dose: 500,
          box_capacity: 30,
          stock_quantity: 25,
          stock_alert_threshold: 5,
          conditions: [],
        },
      ]);
      setLoadingBoxes(true);
    }
  }, [isDemo]);

  // =========================================================================
  // CALENDAR ACTIONS
  // =========================================================================

  const handleDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => {
        const r = await personalCalendars.deleteCalendar(calendarId!);
        if (r.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const handleDeleteSharedCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('delete_calendar_title'),
      t('delete_calendar_description'),
      async () => {
        const r = await sharedUserCalendars.deleteSharedCalendar(calendarId!);
        if (r.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const getCommonActions = () => {
    const builder = calendarType === 'personal'
      ? buildPersonalCalendarActions(
          { calendarId: calendarId!, lng: lng!, basePath, selectedDate: null },
          {
            onRename: undefined,
            onDelete: handleDeleteCalendar,
            onExportPdf: () => calendarSource.downloadCalendarPdf!(calendarId!, false),
          },
          ['rename', 'medicines'],
        )
      : buildSharedCalendarActions(
          { calendarId: calendarId!, lng: lng!, basePath, selectedDate: null },
          {
            onDelete: handleDeleteSharedCalendar,
            onExportPdf: () => calendarSource.downloadCalendarPdf!(calendarId!, false),
          },
          ['medicines'],
        );
    return toActionSheetItems(builder, t);
  };

  // =========================================================================
  // LOADING STATES
  // =========================================================================

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loadingBoxes === undefined, t('boxes.loading_medicine_boxes'));
  }, [loadingBoxes, showLoading, t]);

  return {
    t, lng,
    boxes,
    expandedBoxes, setExpandedBoxes,
    notFound,
    calendarId,
    calendarSource,
    basePath,
    getCommonActions,
    // Box editing
    editingBoxId, editingBox, setEditingBox, initEditing, cancelEditing,
    addCondition, deleteCondition, updateCondition, handleSubmit, createTemporaryBox,
    conditionFields,
    // Scanner
    showQRModal, singleScan, addScannedMedicines, updateScannedMedicine,
    openAddScan, openUpdateScan, closeScanner,
  };
}
