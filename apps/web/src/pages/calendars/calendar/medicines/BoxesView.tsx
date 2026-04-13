import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, buildPersonalCalendarActions, buildSharedCalendarActions, detectCalendarType } from '@meditime/utils';
import { v4 as uuidv4 } from 'uuid';
import ActionSheet from '@/components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import QRCodeScanner from '@/components/scanner/QRCodeScanner';
import AlertBanner from '@/components/common/AlertBanner';
import type {
  BoxesViewPageProps,
  BoxesViewBoxItem,
  QRScannedMedicine,
  ConditionFieldKey,
  ConditionValue,
  ConditionFieldConfig,
  EditingBoxState,
  EditableCondition,
} from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';

import { Package, PlusCircle, QrCode, AlertTriangle } from 'lucide-react';
import NotFound from '../../../general/NotFound';

// Extracted components
import ActionCard from './components/ActionCard';
import MedicineCard from './components/MedicineCard';
import EditBoxDialog from './components/EditBoxDialog';

// ============================================================================
// MAIN COMPONENT: BoxesView
// ============================================================================

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }: BoxesViewPageProps) {
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [singleScan, setSingleScan] = useState(false);
  const [currentEditingBoxId, setCurrentEditingBoxId] = useState<string | null>(null);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [editingBox, setEditingBox] = useState<EditingBoxState | null>(null);
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
  // HELPER FUNCTIONS
  // =========================================================================

  // Fonction pour créer une box temporaire en mode édition (ouvre la modal)
  const createTemporaryBox = (medicineData: Partial<BoxesViewBoxItem> = {}) => {
    const tempId = `temp-${Date.now()}`;
    const newBox = {
      id: tempId,
      name: medicineData.name || '',
      dose: medicineData.dose || 0,
      box_capacity: medicineData.box_capacity || 0,
      stock_quantity: medicineData.stock_quantity || 0,
      stock_alert_threshold: medicineData.stock_alert_threshold || 10,
      code_fmd: medicineData.code_fmd || null,
      conditions: medicineData.conditions || [],
    };
    
    initEditing(newBox);
  };

  // Fonction pour supprimer le calendrier avec confirmation
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

  // Fonction pour supprimer un calendrier partagé avec confirmation
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

  const initEditing = (box: BoxesViewBoxItem) => {
    setEditingBoxId(box.id);
    setEditingBox({
      name: box.name,
      dose: box.dose ?? null,
      box_capacity: box.box_capacity,
      stock_alert_threshold: box.stock_alert_threshold,
      stock_quantity: box.stock_quantity,
      code_fmd: box.code_fmd || null,
      conditions: (box.conditions || []).reduce<Record<string, EditableCondition>>(
        (acc, c) => ({
          ...acc,
          [c.id]: {
            ...c,
            max_date_mode: c.max_date 
              ? (c.max_date_days ? 'for_days' : 'until_date')
              : 'none',
          }
        }), 
        {}
      ),
    });
  };

  const resetEditing = () => {
    setEditingBoxId(null);
    setEditingBox(null);
  };
  
  const cancelEditing = () => {
    resetEditing();
  };

  // =========================================================================
  // CONDITION EDITING HELPERS
  // =========================================================================

  const addCondition = () => {
    const id = uuidv4();
    setEditingBox((p) => p ? ({
      ...p,
      conditions: {
        ...p.conditions,
        [id]: {
          id,
          tablet_count: 1,
          interval_days: 1,
          start_date: null,
          time_of_day: 'morning',
          max_date: null,
          max_date_mode: 'none',
          max_date_days: null,
        },
      },
    }) : p);
  };

  const deleteCondition = (id: string) => {
    setEditingBox((p) => p ? ({
      ...p,
      conditions: { ...p.conditions, [id]: undefined },
    }) : p);
  };

  const updateCondition = (id: string, field: ConditionFieldKey, val: ConditionValue) => {
    setEditingBox((p) => p ? ({
      ...p,
      conditions: {
        ...p.conditions,
        [id]: { ...p.conditions[id]!, [field]: val },
      },
    }) : p);
  };

  const conditionFields: ConditionFieldConfig[] = [
    {
      label: t('boxes.condition.tablet_count'),
      field: 'tablet_count',
      type: 'number',
      min: '0',
      step: '0.25',
      format: 'float',
      required: true,
    },
    {
      label: t('boxes.condition.time_of_day'),
      field: 'time_of_day',
      type: 'select',
      options: [
        { value: 'morning', label: t('morning') },
        { value: 'noon', label: t('noon') },
        { value: 'evening', label: t('evening') },
      ],
      required: true,
    },
    {
      label: t('boxes.condition.interval_days'),
      field: 'interval_days',
      type: 'number',
      min: '0',
      step: '1',
      format: 'int',
      onChange: (_cond, value, updateFn) => {
        if (Number(value) <= 1) {
          updateFn('start_date', null);
        }
      },
      required: true,
    },
    {
      label: t('boxes.condition.start_date'),
      field: 'start_date',
      type: 'date',
      ifComplete: (cond) => Number(cond.interval_days) > 1,
      required: (cond) => Number(cond.interval_days) > 1,
    },
    {
      label: t('boxes.condition.max_date_mode'),
      field: 'max_date_mode',
      type: 'select',
      options: [
        { value: 'none', label: t('boxes.condition.no_limit') },
        { value: 'until_date', label: t('boxes.condition.until_date') },
        { value: 'for_days', label: t('boxes.condition.for_days') },
      ],
      onChange: (_cond, _value, updateFn) => {
        updateFn('max_date', null);
        updateFn('max_date_days', null);
      },
      required: false,
    },
    {
      label: (cond) => cond.max_date_mode === 'until_date' 
        ? t('boxes.condition.end_date') 
        : t('boxes.condition.duration_days'),
      field: (cond) => cond.max_date_mode === 'until_date' ? 'max_date' : 'max_date_days',
      type: (cond) => cond.max_date_mode === 'until_date' ? 'date' : 'number',
      min: '1',
      step: '1',
      format: (cond) => cond.max_date_mode === 'until_date' ? '' : 'int',
      onChange: (cond, value, updateFn) => {
        if (!value || value === '') {
          updateFn('max_date', null);
          if (cond.max_date_mode === 'for_days') updateFn('max_date_days', null);
          return;
        }
        
        if (cond.max_date_mode === 'for_days') {
          const now = new Date();
          const target = new Date(now);
          const hourByTime = { morning: 8, noon: 12, evening: 18 } as const;
          const targetHour = cond.time_of_day ? hourByTime[cond.time_of_day] : 8;
          target.setHours(targetHour, 0, 0, 0);
          const includeToday = now < target;
          const endDate = new Date(now);
          const daysValue = Number(value);
          endDate.setDate(endDate.getDate() + (includeToday ? daysValue - 1 : daysValue));
          endDate.setHours(23, 59, 59, 999);
          updateFn('max_date', endDate.toISOString());
          updateFn('max_date_days', daysValue);
        } else {
          const selectedDate = new Date(String(value));
          selectedDate.setHours(23, 59, 59, 999);
          updateFn('max_date', selectedDate.toISOString());
        }
      },
      ifComplete: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
      required: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
    },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBox) return;
    const conditions = Object.values(editingBox.conditions || {}).filter(
      (c): c is EditableCondition => c !== undefined
    );
    
    // Si c'est une nouvelle box temporaire (ID commence par "temp-")
    if (String(editingBoxId || '').startsWith('temp-')) {
      await calendarSource.createBox!(
        calendarId!,
        editingBox.name,
        editingBox.box_capacity ?? 0,
        editingBox.stock_alert_threshold ?? 0,
        editingBox.stock_quantity ?? 0,
        editingBox.dose,
        conditions,
        editingBox.code_fmd
      );
    } else {
      // Mise à jour d'une box existante
      await calendarSource.updateBox!(
        calendarId!, 
        editingBoxId!, 
        {
          name: editingBox.name,
          dose: editingBox.dose ?? undefined,
          box_capacity: editingBox.box_capacity ?? undefined,
          stock_alert_threshold: editingBox.stock_alert_threshold ?? undefined,
          stock_quantity: editingBox.stock_quantity ?? undefined,
          code_fmd: editingBox.code_fmd,
          conditions,
        }
      );
    }
    
    resetEditing();
  };

  const processMedicineCreation = async (med: QRScannedMedicine) => {
    const res = await calendarSource.createBox!(
      calendarId!,
      med.name,
      med.box_capacity,
      med.stock_alert_threshold,
      med.stock_quantity,
      med.dose,
      [],
      med.code_fmd
    );
    return res.success;
  };

  const addScannedMedicines = async (medicines: QRScannedMedicine[]) => {
    // Fermer la modal
    setShowQRModal(false);
    
    // Si un seul médicament, créer une box temporaire en mode édition
    if (medicines.length === 1) {
      createTemporaryBox(medicines[0] as unknown as Partial<BoxesViewBoxItem>);
      return { success: true, successCount: 1, errorCount: 0 };
    }
    
    // Sinon, ajouter tous les médicaments directement
    let success = 0;
    let error = 0;
    
    for (const med of medicines) {
      if (await processMedicineCreation(med)) {
        success++;
      } else {
        error++;
      }
    }
    return { success: error === 0, successCount: success, errorCount: error };
  };

  const updateScannedMedicine = async (medicines: QRScannedMedicine[]) => {
    const med = medicines[0];
    const currentBox = boxes.find((b) => b.id === currentEditingBoxId);
    
    const res = await calendarSource.updateBox!(
      calendarId!,
      currentEditingBoxId!,
      {
        name: med.name,
        dose: med.dose,
        box_capacity: med.box_capacity,
        stock_alert_threshold: med.stock_alert_threshold,
        stock_quantity: med.stock_quantity,
        code_fmd: med.code_fmd,
        conditions: currentBox?.conditions || [],
      }
    );
    
    setShowQRModal(false);
    setCurrentEditingBoxId(null);
    setSingleScan(false);
    
    return {
      success: res.success,
      successCount: res.success ? 1 : 0,
      errorCount: res.success ? 0 : 1,
    };
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

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(loadingBoxes === undefined, t('boxes.loading_medicine_boxes'));
  }, [loadingBoxes, showLoading, t]);

  // Affichage de la page 404 si le calendrier n'existe pas
  if (notFound) {
    return <NotFound />;
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div className="container mx-auto flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl">
        
        {/* Header */}
        <div
          className="flex justify-between items-center mb-4 flex-wrap gap-2"
          data-tour="stock-view-title"
        >
          <h4 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('boxes.title')}
          </h4>
          <ActionSheet actions={getCommonActions()} />
        </div>

        {/* Stock Alert Banner */}
        {boxes.some(box => box.stock_quantity <= box.stock_alert_threshold && box.stock_alert_threshold > 0) && (
          <AlertBanner
            to={`/${lng}/${basePath}/${calendarId}/stock-alerts`}
            icon={AlertTriangle}
            text={t('stock_alert')}
            tooltip={t('stock_alert_tooltip')}
            variant="warning"
          />
        )}

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map((box) => (
            <MedicineCard
              key={box.id}
              box={box}
              expandedBoxes={expandedBoxes}
              setExpandedBoxes={setExpandedBoxes}
              calendarId={calendarId}
              calendarSource={calendarSource}
              onEdit={initEditing}
              onUpdateScan={() => {
                setSingleScan(true);
                setCurrentEditingBoxId(box.id);
                setShowQRModal(true);
              }}
              basePath={basePath}
              t={t}
            />
          ))}

          {/* Action Cards */}
          <div className="flex flex-col gap-3 h-full">
            <ActionCard
              variant="success"
              icon={PlusCircle}
              text={t('boxes.add_manual')}
              onClick={() => createTemporaryBox()}
              hasTooltip={false}
              dataTour="add-manual-btn"
            />
            <ActionCard
              variant="primary"
              icon={QrCode}
              text={t('boxes.add_with_qr')}
              onClick={() => {
                setSingleScan(false);
                setCurrentEditingBoxId(null);
                setShowQRModal(true);
              }}
              hasTooltip={true}
              tooltip={t('boxes.qr_code_help_text')}
              dataTour="add-qr-btn"
            />
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        modal={true}
        show={showQRModal}
        singleScan={singleScan}
        onAddAll={singleScan ? updateScannedMedicine : addScannedMedicines}
        onClose={() => {
          setShowQRModal(false);
          setCurrentEditingBoxId(null);
          setSingleScan(false);
        }}
      />

      {/* Edit Box Dialog */}
      <EditBoxDialog
        editingBoxId={editingBoxId}
        editingBox={editingBox}
        conditionFields={conditionFields}
        setEditingBox={setEditingBox}
        onSubmit={handleSubmit}
        onCancel={cancelEditing}
        onAddCondition={addCondition}
        onDeleteCondition={deleteCondition}
        onUpdateCondition={updateCondition}
      />
    </div>
  );
}

export default BoxesView;