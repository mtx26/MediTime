import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap } from '@/utils/calendar/calendarSourceMap';
import { v4 as uuidv4 } from 'uuid';
import { fetchSuggestions } from '@/utils/api/fetchSuggestions';
import ActionSheet from '@/components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import QRCodeScanner from '@/components/scanner/QRCodeScanner';
import Tooltips from '@/components/common/Tooltips';
import PropTypes from 'prop-types';
import IconButton from '@/components/common/UtilityComponents';

// Composants shadcn/ui
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Icônes Lucide
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
  Trash2, 
  Save, 
  X,
  PlusCircle,
  Download,
  Share2,
  Calendar,
  Settings,
  FileText,
  Pencil,
  ScanLine
} from 'lucide-react';
import NotFound from '../../../general/NotFound';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const StatusBadge = ({ variant, icon: Icon, text, tooltip }) => {
  const variantMap = {
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    danger: 'bg-destructive text-white',
    success: 'bg-green-500 text-white hover:bg-green-600',
    secondary: 'bg-secondary text-secondary-foreground',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
  };

  const content = (
    <Badge className={cn('gap-1', variantMap[variant] || variantMap.secondary)}>
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

StatusBadge.propTypes = {
  variant: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  text: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
};

const ActionCard = ({ variant, icon: Icon, text, onClick, hasTooltip, tooltip, dataTour }) => {
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

ActionCard.propTypes = {
  variant: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  hasTooltip: PropTypes.bool,
  tooltip: PropTypes.string,
  dataTour: PropTypes.string,
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
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(name);
  }, [name]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSelect = (item) => {
    const onlyNumbers = parseInt(item.dose.replace(/\D/g, ''));
    const itemName = item.name;
    setInputValue(itemName);
    onChangeName(itemName);
    onChangeDose(onlyNumbers);
    onChangeBoxCapacity(item.conditionnement);
    onChangeStockQuantity(item.conditionnement);
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
      setSuggestions(results);
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
          size="sm"
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
          size="sm"
          required
          value={dose || ''}
          onChange={(e) => onChangeDose(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
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

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const lng = params.lng;
  const { t } = useTranslation();

  // =========================================================================
  // STATE
  // =========================================================================
  
  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const { showConfirm } = useAlert();
  const [showQRModal, setShowQRModal] = useState(false);
  const [singleScan, setSingleScan] = useState(false);
  const [currentEditingBoxId, setCurrentEditingBoxId] = useState(null);
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [editingBoxId, setEditingBoxId] = useState(null);
  const [editingBox, setEditingBox] = useState(null);
  const [rep, setRep] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // =========================================================================
  // CALENDAR DETECTION
  // =========================================================================
  
  const pathWithoutLang = location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    basePath = 'shared-user-calendar';
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars, 
    sharedUserCalendars, 
    tokenCalendars
  )[calendarType];
  
  const isDemo = calendarId === 'demo';

  // =========================================================================
  // HOOKS
  // =========================================================================
  
  useRealtimeBoxesSwitcher(
    isDemo ? null : calendarType, 
    calendarId, 
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
          dose: '1000 mg',
          box_capacity: 8,
          stock_quantity: 5,
          stock_alert_threshold: 2,
          conditions: [],
        },
        {
          id: 'demo-2',
          name: 'Amoxicilline',
          dose: '500 mg',
          box_capacity: 12,
          stock_quantity: 1,
          stock_alert_threshold: 3,
          conditions: [],
        },
        {
          id: 'demo-3',
          name: 'Vitamin C',
          dose: '500 mg',
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
  const createTemporaryBox = (medicineData = {}) => {
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
    setBoxes((prev) => [...prev, newBox]);
    
    // Mettre en mode édition
    initEditing(newBox);
    setExpandedBoxes((p) => ({
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
        const r = await personalCalendars.deleteCalendar(calendarId);
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
        const r = await sharedUserCalendars.deleteSharedCalendar(calendarId);
        if (r.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const initEditing = (box) => {
    setEditingBoxId(box.id);
    setEditingBox({
      name: box.name,
      dose: box.dose,
      box_capacity: box.box_capacity,
      stock_alert_threshold: box.stock_alert_threshold,
      stock_quantity: box.stock_quantity,
      code_fmd: box.code_fmd || null,
      conditions: box.conditions.reduce(
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
    // Si c'est une box temporaire, la supprimer
    if (editingBoxId && editingBoxId.startsWith('temp-')) {
      setBoxes(prev => prev.filter(b => b.id !== editingBoxId));
    }
    resetEditing();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const conditions = Object.values(editingBox.conditions || {}).filter(
      c => c !== undefined
    );
    
    // Si c'est une nouvelle box temporaire (ID commence par "temp-")
    if (editingBoxId.startsWith('temp-')) {
      await calendarSource.createBox(
        calendarId,
        editingBox.name,
        editingBox.box_capacity,
        editingBox.stock_alert_threshold,
        editingBox.stock_quantity,
        editingBox.dose,
        conditions,
        editingBox.code_fmd
      );
    } else {
      // Mise à jour d'une box existante
      await calendarSource.updateBox(
        calendarId, 
        editingBoxId, 
        { ...editingBox, conditions }
      );
    }
    
    resetEditing();
  };

  const processMedicineCreation = async (med) => {
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

  const addScannedMedicines = async (medicines) => {    
    // Fermer la modal
    setShowQRModal(false);
    
    // Si un seul médicament, créer une box temporaire en mode édition
    if (medicines.length === 1) {
      createTemporaryBox(medicines[0]);
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

  const updateScannedMedicine = async (medicines) => {    
    const med = medicines[0];
    const currentBox = boxes.find(b => b.id === currentEditingBoxId);
    
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
    const actions = [
      {
        label: (
          <>
            <Download className="h-4 w-4 mr-2" />
            {t('boxes.export_pdf')}
          </>
        ),
        onClick: () => calendarSource.downloadCalendarPdf(calendarId),
        title: t('boxes.export_pdf'),
      },
    ];
    
    if (calendarType === 'personal') {
      actions.unshift({
        label: (
          <>
            <Share2 className="h-4 w-4 mr-2" />
            {t('share')}
          </>
        ),
        linkTo: `/${lng}/shared-calendars?calendar=${calendarId}`,
        title: t('share'),
      });
      actions.push(
        { separator: true },
        {
          label: (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('stock')}
            </>
          ),
          linkTo: `/${lng}/${basePath}/${calendarId}/stock-alerts`,
          title: t('stock'),
        }
      );
    }
    
    actions.push(
      {
        label: (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            {t('ics.calendar_ics')}
          </>
        ),
        linkTo: `/${lng}/${basePath}/${calendarId}/ics-tokens`,
        title: t('ics.calendar_ics'),
      },
      { separator: true },
      {
        label: (
          <>
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.label')}
          </>
        ),
        linkTo: `/${lng}/${basePath}/${calendarId}/settings`,
        title: t('settings.label'),
      },
      { separator: true }
    );
    
    if (calendarType === 'personal') {
      actions.push({
        label: (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('delete')}
          </>
        ),
        onClick: handleDeleteCalendar,
        title: t('delete'),
        danger: true,
      });
    } else if (calendarType === 'sharedUser') {
      actions.push({
        label: (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('delete')}
          </>
        ),
        onClick: handleDeleteSharedCalendar,
        title: t('delete'),
        danger: true,
      });
    }
    
    return actions;
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
  t,
}) {
  const { showConfirm } = useAlert();
  
  const isEditing = editingBoxId === box.id && editingBox && editingBox.name !== undefined;
  
  const timeOfDayMap = {
    morning: t('morning'),
    noon: t('noon'),
    evening: t('evening'),
  };
  
  const conditionFields = [
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
      onChange: (cond, value, updateFn) => {
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
      ifComplete: (cond) => cond.interval_days > 1,
      required: (cond) => cond.interval_days > 1,
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
      onChange: (cond, value, updateFn) => {
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
          const hourByTime = { morning: 8, noon: 12, evening: 18 };
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
      ifComplete: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
      required: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
    },
  ];

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================
  
  const openNotice = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/proxy/pdf/${box.id}`, '_blank');
  };

  const toggleExpand = () => {
    setExpandedBoxes((p) => ({ ...p, [box.id]: !p[box.id] }));
  };

  const deleteBox = async (calendarId, boxId) => {
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
    setEditingBox((p) => ({
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

  const deleteCondition = (id) => {
    setEditingBox((p) => ({
      ...p,
      conditions: { ...p.conditions, [id]: undefined },
    }));
  };

  const updateCondition = (id, field, val) => {
    setEditingBox((p) => ({
      ...p,
      conditions: {
        ...p.conditions,
        [id]: { ...p.conditions[id], [field]: val },
      },
    }));
  };

  const getBoxActions = () => [
    {
      label: (
        <>
          <ScanLine className="h-4 w-4 mr-2" />
          {t('boxes.scan_qr_code')}
        </>
      ),
      onClick: onUpdateScan,
      title: t('boxes.scan_qr_code'),
    },
    { separator: true },
    {
      label: (
        <>
          <Pencil className="h-4 w-4 mr-2" />
          {t('boxes.edit')}
        </>
      ),
      onClick: () => onEdit(box),
      title: t('boxes.edit'),
      dataTour: 'box-edit-btn',
    },
    {
      label: (
        <>
          <FileText className="h-4 w-4 mr-2" />
          {t('boxes.view_notice')}
        </>
      ),
      onClick: openNotice,
      title: t('boxes.view_notice'),
    },
    { separator: true },
    {
      label: (
        <>
          <Trash2 className="h-4 w-4 mr-2" />
          {t('boxes.delete')}
        </>
      ),
      onClick: () => deleteBox(calendarId, box.id),
      title: t('boxes.delete'),
      danger: true,
    },
  ];

  const getBorderClass = () => {
    const allExpired = box.conditions?.every((c) => {
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
              setEditingBox((p) => ({ ...p, name: value }))
            }
            onChangeDose={(value) =>
              setEditingBox((p) => ({ ...p, dose: value }))
            }
            onChangeBoxCapacity={(value) =>
              setEditingBox((p) => ({ ...p, box_capacity: value }))
            }
            onChangeStockQuantity={(value) =>
              setEditingBox((p) => ({ ...p, stock_quantity: value }))
            }
            onChangeCodeFmd={(value) =>
              setEditingBox((p) => ({ ...p, code_fmd: value }))
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
                size="sm"
                value={editingBox.box_capacity ?? ''}
                onChange={(e) =>
                  setEditingBox((p) => ({
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
                size="sm"
                value={editingBox.stock_alert_threshold ?? ''}
                onChange={(e) =>
                  setEditingBox((p) => ({
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
        <div className="flex gap-4 mb-3 items-end">
          <div className="flex-1">
            <Label className="text-muted-foreground text-xs">{t('boxes.remaining_qty')}</Label>
            {isEditing ? (
              <Input
                type="number"
                size="sm"
                value={editingBox.stock_quantity ?? ''}
                onChange={(e) =>
                  setEditingBox((p) => ({
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
          )}
        </div>

        {/* Stock Badges */}
        {!isEditing && (
          <div className="flex flex-wrap gap-2 mb-3">
            {box.conditions.filter((c) => c !== undefined).length === 0 && (
              <button
                className="p-0 border-0 bg-transparent"
                onClick={() => {
                  setExpandedBoxes((p) => ({ ...p, [box.id]: true }));
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
            
            {box.conditions?.every((c) => {
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
              box.conditions?.some((c) => {
                if (!c?.max_date) return false;
                return new Date() > new Date(c.max_date);
              }) ? (
                <button
                  className="p-0 border-0 bg-transparent"
                  onClick={() => setExpandedBoxes((p) => ({ ...p, [box.id]: true }))}
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
                    .filter((c) => c !== undefined)
                    .map((cond) => (
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
                                        onChange(cond, value, (f, v) => updateCondition(cond.id, f, v));
                                      }
                                    }}
                                    required={resolvedRequired}
                                  >
                                    <SelectTrigger size="sm" className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                          {o.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type={resolvedType}
                                    size="sm"
                                    value={
                                      (resolvedField === 'start_date' || (resolvedField === 'max_date' && resolvedType === 'date')) && cond[resolvedField]
                                        ? new Date(cond[resolvedField]).toISOString().split('T')[0]
                                        : cond[resolvedField] ?? ''
                                    }
                                    min={min}
                                    step={step}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      if (resolvedFormat === 'int') {
                                        value = parseInt(value);
                                      } else if (resolvedFormat === 'float') {
                                        value = parseFloat(value);
                                      }
                                      updateCondition(cond.id, resolvedField, value);
                                      if (onChange) {
                                        onChange(cond, value, (f, v) => updateCondition(cond.id, f, v));
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
                          size="sm"
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
                    size="sm"
                    className="w-full"
                    onClick={addCondition}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('boxes.condition.add')}
                  </Button>
                </>
              ) : box.conditions.filter((c) => c !== undefined).length > 0 ? (
                box.conditions
                  .filter((c) => c !== undefined)
                  .map((cond) => (
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
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {t('boxes.save')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
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

BoxCard.propTypes = {
  box: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    dose: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    box_capacity: PropTypes.number,
    stock_quantity: PropTypes.number,
    stock_alert_threshold: PropTypes.number,
    conditions: PropTypes.arrayOf(PropTypes.shape({
      tablet_count: PropTypes.number,
      time_of_day: PropTypes.string,
      interval_days: PropTypes.number,
      start_date: PropTypes.string,
      max_date: PropTypes.string,
    })),
  }).isRequired,
  editingBoxId: PropTypes.string,
  editingBox: PropTypes.object,
  setEditingBox: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  expandedBoxes: PropTypes.object.isRequired,
  setExpandedBoxes: PropTypes.func.isRequired,
  calendarId: PropTypes.string.isRequired,
  calendarSource: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onUpdateScan: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

BoxesView.propTypes = {
  personalCalendars: PropTypes.object,
  sharedUserCalendars: PropTypes.shape({
    deleteSharedCalendar: PropTypes.func,
  }),
  tokenCalendars: PropTypes.object,
};

export default BoxesView;

