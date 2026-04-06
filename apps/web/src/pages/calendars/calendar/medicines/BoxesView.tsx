import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, buildPersonalCalendarActions, buildSharedCalendarActions, buildBoxActions, detectCalendarType } from '@meditime/utils';
import { v4 as uuidv4 } from 'uuid';
import { fetchSuggestions } from '@/utils/api/fetchSuggestions';
import ActionSheet from '@/components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import QRCodeScanner from '@/components/scanner/QRCodeScanner';
import Tooltips from '@/components/common/Tooltips';
import IconButton from '@/components/common/UtilityComponents';
import type {
  AnyRecord,
  BoxesViewPageProps,
  BoxesViewBoxItem,
  MedicineReviewSuggestion,
  QRScannedMedicine,
  StatusBadgeProps as SharedStatusBadgeProps,
  ActionCardProps as SharedActionCardProps,
  InputDropdownProps,
} from '@meditime/types';

// Composants shadcn/ui
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Icônes Lucide
import type { LucideIcon } from 'lucide-react';
import { 
  Package, 
  Plus, 
  QrCode, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  PauseCircle, 
  AlertCircle, 
  BellOff,
  ChevronUp, 
  ChevronDown, 
  ChevronRight,
  Trash2, 
  Save, 
  X,
  PlusCircle,
} from 'lucide-react';
import NotFound from '../../../general/NotFound';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

type StatusBadgeProps = SharedStatusBadgeProps<LucideIcon>;
type ActionCardProps = SharedActionCardProps<LucideIcon>;

const QRCodeScannerAny = QRCodeScanner as any;

const StatusBadge = ({ variant, icon: Icon, text, tooltip }: StatusBadgeProps) => {
  const variantMap = {
    warning: 'bg-yellow-500/15 text-foreground border-yellow-500/50',
    danger: 'bg-red-500/15 text-foreground border-red-500/50',
    success: 'bg-green-500/15 text-foreground border-green-500/50',
    secondary: 'bg-secondary/15 text-foreground border-secondary/50',
    info: 'bg-blue-500/15 text-foreground border-blue-500/50',
  };

  const content = (
    <Badge variant="outline" className={cn('gap-1', variantMap[variant] || variantMap.secondary)}>
      {Icon && <Icon className="h-3 w-3" />}
      {text}
    </Badge>
  );

  return tooltip ? (
    <Tooltips content={tooltip} side="bottom">
      {content}
    </Tooltips>
  ) : (
    content
  );
};

const ActionCard = ({ variant, icon: Icon, text, onClick, hasTooltip, tooltip, dataTour }: ActionCardProps) => {
  const variantStyles = {
    success: 'border-green-500',
    primary: 'border-primary',
  };

  const iconStyles = {
    success: 'text-green-500',
    primary: 'text-primary',
  };

  return (
    <button 
      type="button" 
      onClick={onClick} 
      className="w-full p-0 border-0 bg-transparent text-left flex-1 cursor-pointer" 
      data-tour={dataTour}
      aria-label={text}
      title={text}
    >
      <Card className={cn('h-full shadow-sm border-2 transition-colors relative', variantStyles[variant])}>
        <CardContent className="flex flex-col justify-center items-center">
          {hasTooltip && (
            <Tooltips content={tooltip} side="bottom" className="absolute top-1 right-1 p-1" propagation={false}>
              <Info className="h-4 w-4 text-blue-500" />
            </Tooltips> 
          )}
          <Icon className={cn('h-10 w-10', iconStyles[variant])} />
          <p className={cn('font-semibold mt-2 mb-0 text-center', iconStyles[variant])}>
            {text}
          </p>
        </CardContent>
      </Card>
    </button>
  );
};

const InputDropdown = ({
  name,
  dose,
  onChangeName,
  onChangeDose,
  onChangeBoxCapacity,
  onChangeStockQuantity,
  onChangeCodeFmd,
  fetchSuggestions,
}: InputDropdownProps) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<MedicineReviewSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(name);
  }, [name]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSelect = (item: MedicineReviewSuggestion) => {
    const onlyNumbers = parseInt(String(item.dose || '').replace(/\D/g, ''), 10) || 0;
    const itemName = item.name;
    setInputValue(itemName);
    onChangeName(itemName);
    onChangeDose(onlyNumbers);
    const parsedCapacity = Number(item.conditionnement) || 0;
    onChangeBoxCapacity(parsedCapacity);
    onChangeStockQuantity(parsedCapacity);
    if (item.code_fmd) {
      onChangeCodeFmd(item.code_fmd);
    }
    setShowDropdown(false);
    setSuggestions([]);
  };

  useEffect(() => {
    if (!name || name.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchData = async () => {
      const results = await fetchSuggestions(name, dose);
      setSuggestions((results || []) as MedicineReviewSuggestion[]);
    };

    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [name, dose]);

  return (
    <div className="relative flex mb-3 gap-3">
      <div className="flex-1">
        <Label className="text-muted-foreground text-xs">{t('boxes.name')}</Label>
        <Input
          ref={inputRef}
          type="text"
          required
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChangeName(e.target.value);
            setShowDropdown(true);
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('boxes.start_typing')}
          aria-label={t('boxes.name')}
        />
      </div>
      <div className="w-24">
        <Label className="text-muted-foreground text-xs">{t('boxes.dose')}</Label>
        <Input
          type="number"
          required
          value={dose || ''}
          onChange={(e) => onChangeDose(e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          aria-label={t('boxes.dose')}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full z-50 mt-1 bg-popover border rounded-md shadow-md max-h-50 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handleSelect(item)}
            >
              {item.name} - {item.dose} - {item.conditionnement} {item.forme_pharmaceutique}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [expandedBoxes, setExpandedBoxes] = useState<Record<string, boolean>>({});
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [editingBox, setEditingBox] = useState<AnyRecord | null>(null);
  const [rep, setRep] = useState<AnyRecord | null>(null);
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
  )[calendarType] || {}) as AnyRecord;
  
  const isDemo = calendarId === 'demo';

  // =========================================================================
  // HOOKS
  // =========================================================================
  
  useRealtimeBoxesSwitcher(
    isDemo ? '' : calendarType,
    calendarId ?? null,
    setBoxes as any,
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

  // Fonction pour créer une box temporaire en mode édition
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
    
    // Ajouter la box au state local
    setBoxes((prev) => [...prev, newBox as BoxesViewBoxItem]);
    
    // Mettre en mode édition
    initEditing(newBox);
    setExpandedBoxes((p: AnyRecord) => ({
      ...p,
      [tempId]: true,
    }));

    return tempId;
  };

  // Fonction pour supprimer le calendrier avec confirmation
  const handleDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => {
        const r = await (personalCalendars as AnyRecord).deleteCalendar(calendarId);
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
        const r = await (sharedUserCalendars as AnyRecord).deleteSharedCalendar(calendarId);
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
      dose: box.dose,
      box_capacity: box.box_capacity,
      stock_alert_threshold: box.stock_alert_threshold,
      stock_quantity: box.stock_quantity,
      code_fmd: box.code_fmd || null,
      conditions: (box.conditions || []).reduce(
        (acc: AnyRecord, c: AnyRecord) => ({
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
    // Si c'est une box temporaire, la supprimer
    if (editingBoxId && String(editingBoxId).startsWith('temp-')) {
      setBoxes(prev => prev.filter(b => b.id !== editingBoxId));
    }
    resetEditing();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentEditing = editingBox || {};
    const conditions = Object.values(currentEditing.conditions || {}).filter(
      (c) => c !== undefined
    );
    
    // Si c'est une nouvelle box temporaire (ID commence par "temp-")
    if (String(editingBoxId || '').startsWith('temp-')) {
      await calendarSource.createBox(
        calendarId,
        currentEditing.name,
        currentEditing.box_capacity,
        currentEditing.stock_alert_threshold,
        currentEditing.stock_quantity,
        currentEditing.dose,
        conditions,
        currentEditing.code_fmd
      );
    } else {
      // Mise à jour d'une box existante
      await calendarSource.updateBox(
        calendarId, 
        editingBoxId, 
        { ...currentEditing, conditions }
      );
    }
    
    resetEditing();
  };

  const processMedicineCreation = async (med: QRScannedMedicine) => {
    const res = await calendarSource.createBox(
      calendarId,
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
    
    const res = await calendarSource.updateBox(
      calendarId,
      currentEditingBoxId,
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
            onExportPdf: () => calendarSource.downloadCalendarPdf(calendarId),
          },
          ['rename', 'medicines'],
        )
      : buildSharedCalendarActions(
          { calendarId: calendarId!, lng: lng!, basePath, selectedDate: null },
          {
            onDelete: handleDeleteSharedCalendar,
            onExportPdf: () => calendarSource.downloadCalendarPdf(calendarId),
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
          <Link
            className="flex items-center justify-between w-full px-3 py-2 mb-4 rounded-md bg-yellow-500/15 border border-yellow-500/50 text-foreground no-underline shadow"
            to={`/${lng}/${basePath}/${calendarId}/stock-alerts`}
            title={t('stock_alert_tooltip')}
            aria-label={t('stock_alert')}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              <span className="font-semibold">{t('stock_alert')}</span>
            </div>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        )}

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map((box) => (
            <div key={box.id}>
              {editingBoxId === box.id ? (
                <form onSubmit={handleSubmit}>
                  <BoxCard
                    box={box}
                    editingBoxId={editingBoxId}
                    editingBox={editingBox}
                    setEditingBox={setEditingBox}
                    onCancel={cancelEditing}
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
                </form>
              ) : (
                <BoxCard
                  box={box}
                  editingBoxId={editingBoxId}
                  editingBox={editingBox}
                  setEditingBox={setEditingBox}
                  onSubmit={handleSubmit}
                  onCancel={cancelEditing}
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
              )}
            </div>
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
      <QRCodeScannerAny
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
    </div>
  );
}

// ============================================================================
// BOX CARD COMPONENT
// ============================================================================

function BoxCard({
  box,
  editingBoxId,
  editingBox,
  setEditingBox,
  onCancel,
  expandedBoxes,
  setExpandedBoxes,
  calendarId,
  calendarSource,
  onEdit,
  onUpdateScan,
  basePath,
  t,
}: AnyRecord) {
  const { showConfirm } = useAlert();
  const { lng } = useParams<{ lng?: string }>();
  const navigate = useNavigate();
  
  const isEditing = editingBoxId === box.id && editingBox && editingBox.name !== undefined;
  
  const timeOfDayMap: AnyRecord = {
    morning: t('morning'),
    noon: t('noon'),
    evening: t('evening'),
  };
  
  const conditionFields: AnyRecord[] = [
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
      onChange: (_cond: AnyRecord, value: number, updateFn: (field: string, v: any) => void) => {
        if (value <= 1) {
          updateFn('start_date', null);
        }
      },
      required: true,
    },
    {
      label: t('boxes.condition.start_date'),
      field: 'start_date',
      type: 'date',
      ifComplete: (cond: AnyRecord) => cond.interval_days > 1,
      required: (cond: AnyRecord) => cond.interval_days > 1,
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
      onChange: (_cond: AnyRecord, _value: string, updateFn: (field: string, v: any) => void) => {
        updateFn('max_date', null);
        updateFn('max_date_days', null);
      },
      required: false,
    },
    {
      label: (cond: AnyRecord) => cond.max_date_mode === 'until_date' 
        ? t('boxes.condition.end_date') 
        : t('boxes.condition.duration_days'),
      field: (cond: AnyRecord) => cond.max_date_mode === 'until_date' ? 'max_date' : 'max_date_days',
      type: (cond: AnyRecord) => cond.max_date_mode === 'until_date' ? 'date' : 'number',
      min: '1',
      step: '1',
      format: (cond: AnyRecord) => cond.max_date_mode === 'until_date' ? '' : 'int',
      onChange: (cond: AnyRecord, value: any, updateFn: (field: string, v: any) => void) => {
        if (!value || value === '') {
          updateFn('max_date', null);
          if (cond.max_date_mode === 'for_days') updateFn('max_date_days', null);
          return;
        }
        
        if (cond.max_date_mode === 'for_days') {
          const now = new Date();
          const target = new Date(now);
          const hourByTime: AnyRecord = { morning: 8, noon: 12, evening: 18 };
          const targetHour = hourByTime[cond.time_of_day] ?? 8;
          target.setHours(targetHour, 0, 0, 0);
          const includeToday = now < target;
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + (includeToday ? value - 1 : value));
          endDate.setHours(23, 59, 59, 999);
          updateFn('max_date', endDate.toISOString());
          updateFn('max_date_days', value);
        } else {
          const selectedDate = new Date(value);
          selectedDate.setHours(23, 59, 59, 999);
          updateFn('max_date', selectedDate.toISOString());
        }
      },
      ifComplete: (cond: AnyRecord) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
      required: (cond: AnyRecord) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
    },
  ];

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================
  
  const openNotice = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/proxy/pdf/${box.id}`, '_blank');
  };

  const toggleExpand = () => {
    setExpandedBoxes((p: AnyRecord) => ({ ...p, [box.id]: !p[box.id] }));
  };

  const deleteBox = async (calendarId: string, boxId: string) => {
    showConfirm(
      'confirm-danger',
      t('boxes.delete_title'),
      t('boxes.delete_description'),
      async () => {
        await calendarSource.deleteBox(calendarId, boxId);
      }
    );
  };


  const addCondition = () => {
    const id = uuidv4();
    setEditingBox((p: AnyRecord) => ({
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
    }));
  };

  const deleteCondition = (id: string) => {
    setEditingBox((p: AnyRecord) => ({
      ...p,
      conditions: { ...p.conditions, [id]: undefined },
    }));
  };

  const updateCondition = (id: string, field: string, val: any) => {
    setEditingBox((p: AnyRecord) => ({
      ...p,
      conditions: {
        ...p.conditions,
        [id]: { ...p.conditions[id], [field]: val },
      },
    }));
  };

  const getBoxActions = () => toActionSheetItems(
    buildBoxActions({
      onScanQr: onUpdateScan,
      onEdit: () => onEdit(box),
      onViewNotice: openNotice,
      onDelete: () => deleteBox(calendarId, box.id),
    }),
    t,
  );

  const getBorderClass = () => {
    const allExpired = box.conditions?.every((c: AnyRecord) => {
      if (!c?.max_date) return false;
      return new Date() > new Date(c.max_date);
    });
    
    if (allExpired) return 'border-blue-500';
    if (box.box_capacity === 0) return '';
    if (box.stock_quantity <= 0) return 'border-destructive';
    if (box.stock_quantity <= box.stock_alert_threshold) return 'border-amber-500';
    return '';
  };

  // =========================================================================
  // RENDER BOX CARD
  // =========================================================================
  
  return (
    <Card className={cn('h-full shadow-sm', getBorderClass())}>
      <CardContent className="relative">
        
        {/* Action Menu */}
        {!isEditing && (
          <div className="absolute top-0 right-2">
            <ActionSheet buttonSize="sm" actions={getBoxActions()} />
          </div>
        )}

        {/* Title */}
        {isEditing ? (
          <InputDropdown
            name={editingBox.name}
            dose={editingBox.dose}
            onChangeName={(value) =>
              setEditingBox((p: AnyRecord) => ({ ...p, name: value }))
            }
            onChangeDose={(value) =>
              setEditingBox((p: AnyRecord) => ({ ...p, dose: value }))
            }
            onChangeBoxCapacity={(value) =>
              setEditingBox((p: AnyRecord) => ({ ...p, box_capacity: value }))
            }
            onChangeStockQuantity={(value) =>
              setEditingBox((p: AnyRecord) => ({ ...p, stock_quantity: value }))
            }
            onChangeCodeFmd={(value) =>
              setEditingBox((p: AnyRecord) => ({ ...p, code_fmd: value }))
            }
            fetchSuggestions={fetchSuggestions}
          />
        ) : (
          <h5 className="font-semibold text-lg mb-2 pr-8">
            {`${box.name}${box.dose > 0 ? ' (' + box.dose + ' mg)' : ''}`}
          </h5>
        )}

        {/* Capacity and Alert Threshold */}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.capacity')}</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editingBox.box_capacity ?? ''}
                onChange={(e) =>
                  setEditingBox((p: AnyRecord) => ({
                    ...p,
                    box_capacity: e.target.value === '' ? null : parseFloat(e.target.value) || null,
                  }))
                }
                aria-label={t('boxes.capacity')}
              />
            ) : (
              <p className="font-semibold">{box.box_capacity}</p>
            )}
          </div>
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.alert_threshold')}</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editingBox.stock_alert_threshold ?? ''}
                onChange={(e) =>
                  setEditingBox((p: AnyRecord) => ({
                    ...p,
                    stock_alert_threshold: e.target.value === '' ? null : parseFloat(e.target.value) || null,
                  }))
                }
                aria-label={t('boxes.alert_threshold')}
              />
            ) : (
              <p className="font-semibold">{box.stock_alert_threshold}</p>
            )}
          </div>
        </div>

        {/* Stock Quantity and Restock Button */}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.remaining_qty')}</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editingBox.stock_quantity ?? ''}
                onChange={(e) =>
                  setEditingBox((p: AnyRecord) => ({
                    ...p,
                    stock_quantity: e.target.value === '' ? null : parseFloat(e.target.value) || null,
                  }))
                }
                aria-label={t('boxes.remaining_qty')}
              />
            ) : (
              <p className="font-semibold">{box.stock_quantity}</p>
            )}
          </div>
          {!isEditing && (
            <div className='flex-1 flex flex-col gap-2'>
              <div className="flex-1">
                <IconButton
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  icon={PlusCircle}
                  text={t('boxes.restock')}
                  onClick={() => calendarSource.restockBox(calendarId, box.id)}
                  disabled={box.box_capacity === 0}
                  helpDisabled={t('boxes.restock_disabled_tooltip')}
                />
              </div>
              {/* Bouton pour faire le pillulier d'un medoc negatif */}
              {box.stock_quantity < 0 && (
                <div className='flex-1'>
                  <IconButton
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                    icon={Package}
                    text={t('boxes.missing_pillbox')}
                    onClick={() => {
                      const medsIdParam = encodeURIComponent(JSON.stringify([box.id]));
                      navigate(`/${lng}/${basePath}/${calendarId}/pillbox?medsId=${medsIdParam}`);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock Badges */}
        {!isEditing && (
          <div className="flex flex-wrap gap-2 mb-3">
            {box.conditions.filter((c: AnyRecord) => c !== undefined).length === 0 && (
              <button
                className="p-0 border-0 bg-transparent"
                onClick={() => {
                  setExpandedBoxes((p: AnyRecord) => ({ ...p, [box.id]: true }));
                  onEdit(box);
                }}
                aria-label={t('boxes.condition.add')}
              >
                <StatusBadge
                  variant="warning"
                  icon={Info}
                  text={t('boxes.condition.none')}
                  tooltip={t('boxes.condition_none_tooltip')}
                />
              </button>
            )}
            
            {box.conditions?.every((c: AnyRecord) => {
              if (!c?.max_date) return false;
              return new Date() > new Date(c.max_date);
            }) ? (
              <StatusBadge
                variant="info"
                icon={PauseCircle}
                text={t('boxes.condition.inactive')}
                tooltip={t('boxes.condition.inactive_tooltip')}
              />
            ) : (
              box.conditions?.some((c: AnyRecord) => {
                if (!c?.max_date) return false;
                return new Date() > new Date(c.max_date);
              }) ? (
                <button
                  className="p-0 border-0 bg-transparent"
                  onClick={() => setExpandedBoxes((p: AnyRecord) => ({ ...p, [box.id]: true }))}
                  aria-label={t('boxes.condition.add')}
                >
                  <StatusBadge
                    variant="info"
                    icon={AlertCircle}
                    text={t('boxes.condition.expired')}
                    tooltip={t('boxes.condition.expired_tooltip')}
                  />
                </button>
              ) : (
                <>
                  {box.box_capacity !== 0 && (
                    <StatusBadge
                      variant={
                        box.stock_quantity <= 0
                          ? 'danger'
                          : box.stock_quantity <= box.stock_alert_threshold
                          ? 'warning'
                          : 'success'
                      }
                      icon={
                        box.stock_quantity <= 0
                          ? AlertTriangle
                          : box.stock_quantity <= box.stock_alert_threshold
                          ? AlertTriangle
                          : CheckCircle
                      }
                      text={
                        box.stock_quantity <= 0
                          ? t('boxes.stock.badge.out')
                          : box.stock_quantity <= box.stock_alert_threshold
                          ? t('boxes.stock.badge.low')
                          : t('boxes.stock.badge.high')
                      }
                      tooltip={
                        box.stock_quantity <= 0
                          ? t('boxes.stock.badge.tooltip.out')
                          : box.stock_quantity <= box.stock_alert_threshold
                          ? t('boxes.stock.badge.tooltip.low')
                          : t('boxes.stock.badge.tooltip.high')
                      }
                    />
                  )}
                </>
              )
            )}
            
            {(box.box_capacity <= 0 || box.stock_alert_threshold <= 0) && (
              <StatusBadge
                variant="info"
                icon={BellOff}
                text={t('boxes.stock.badge.alerts_disabled')}
                tooltip={t('boxes.stock.badge.tooltip.alerts_disabled')}
              />
            )}
          </div>
        )}

        {/* Conditions Section */}
        <div className="mt-4">
          <div className="border-t border-border pt-2">
            <button
              className="w-full flex justify-between items-center py-2 bg-transparent border-0 cursor-pointer"
              type="button"
              title={t('boxes.intake_conditions')}
              onClick={toggleExpand}
              data-tour="box-condition-toggle"
            >
              <span className="font-medium">{t('boxes.intake_conditions')}</span>
              {expandedBoxes[box.id] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {expandedBoxes[box.id] && (
            <div className="mt-3 space-y-3">
              {isEditing ? (
                <>
                  {Object.values(editingBox.conditions || {})
                    .filter((c: any) => c !== undefined)
                    .map((cond: any) => (
                      <div
                        key={cond.id}
                        className="p-3 border rounded-md bg-muted/50 space-y-3"
                      >
                        {conditionFields.map(
                          ({ label, field, type, min, step, format, options, ifComplete, onChange, required }, idx) => {
                            if (ifComplete && !ifComplete(cond)) {
                              return null;
                            }
                            
                            const resolvedLabel = typeof label === 'function' ? label(cond) : label;
                            const resolvedField = typeof field === 'function' ? field(cond) : field;
                            const resolvedType = typeof type === 'function' ? type(cond) : type;
                            const resolvedFormat = typeof format === 'function' ? format(cond) : format;
                            const resolvedRequired = typeof required === 'function' ? required(cond) : required;
                            
                            return (
                              <div key={`${cond.id}-${resolvedField}-${idx}`} className="space-y-1">
                                <Label className="text-sm">{resolvedLabel}</Label>
                                {resolvedType === 'select' ? (
                                  <Select
                                    value={cond[resolvedField] || 'none'}
                                    onValueChange={(value) => {
                                      updateCondition(cond.id, resolvedField, value);
                                      if (onChange) {
                                        onChange(cond, value, (f: string, v: any) => updateCondition(cond.id, f, v));
                                      }
                                    }}
                                    required={resolvedRequired}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((o: AnyRecord) => (
                                        <SelectItem key={o.value} value={o.value}>
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type={resolvedType}
                                    value={
                                      (resolvedField === 'start_date' || (resolvedField === 'max_date' && resolvedType === 'date')) && cond[resolvedField]
                                        ? new Date(cond[resolvedField]).toISOString().split('T')[0]
                                        : cond[resolvedField] ?? ''
                                    }
                                    min={min}
                                    step={step}
                                    onChange={(e) => {
                                      let value: any = e.target.value;
                                      if (resolvedFormat === 'int') {
                                        value = parseInt(value);
                                      } else if (resolvedFormat === 'float') {
                                        value = parseFloat(value);
                                      }
                                      updateCondition(cond.id, resolvedField, value);
                                      if (onChange) {
                                        onChange(cond, value, (f: string, v: any) => updateCondition(cond.id, f, v));
                                      }
                                    }}
                                    aria-label={resolvedLabel}
                                    required={resolvedRequired}
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => deleteCondition(cond.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('boxes.condition.delete')}
                        </Button>
                      </div>
                    ))
                  }
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addCondition}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('boxes.condition.add')}
                  </Button>
                </>
              ) : box.conditions.filter((c: AnyRecord) => c !== undefined).length > 0 ? (
                box.conditions
                  .filter((c: AnyRecord) => c !== undefined)
                  .map((cond: AnyRecord) => (
                    <div
                      key={cond.id}
                      className="p-3 border rounded-md bg-muted/50"
                    >
                      <p className="mb-1">
                        <strong>{cond.tablet_count}</strong>{' '}
                        {cond.tablet_count > 1 ? t('boxes.tablets') : t('boxes.tablet')}{' '}
                        {t('boxes.every')}{' '}
                        <strong>{cond.interval_days}</strong>{' '}
                        {cond.interval_days > 1 ? t('boxes.days') : t('boxes.day')}{' '}
                        {t('boxes.each')}{' '}
                        <strong>{timeOfDayMap[cond.time_of_day]}</strong>
                      </p>
                      {cond.interval_days > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {t('boxes.from')} {new Date(cond.start_date).toLocaleDateString()}
                        </p>
                      )}
                      {cond.max_date && (
                        <p className="text-sm text-muted-foreground">
                          {t('boxes.until')} {new Date(cond.max_date).toLocaleDateString()}
                        </p>
                      )}
                      {cond.max_date && new Date() > new Date(cond.max_date) && (
                        <div className="mt-2">
                          <StatusBadge
                            variant="info"
                            icon={AlertCircle}
                            text={t('boxes.condition.expired')}
                            tooltip={t('boxes.condition.expired_tooltip_one')}
                          />
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="border rounded-md bg-muted/50 p-3">
                  <p className="text-muted-foreground text-sm">
                    {t('boxes.condition.none')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {t('boxes.save')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-1" />
                {t('boxes.cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BoxesView;



