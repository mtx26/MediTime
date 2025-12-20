import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '../../hooks/realtime/useRealtimeBoxesSwitcher';
import AlertSystem from '../../components/common/AlertSystem';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { v4 as uuidv4 } from 'uuid';
import { fetchSuggestions } from '../../utils/api/fetchSuggestions';
import ActionSheet from '../../components/common/ActionSheet';
import { useTranslation } from 'react-i18next';
import QRCodeScanner from '../../components/scanner/QRCodeScanner';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const IconButton = ({ className, icon, text, onClick, title }) => (
  <button 
    type="button" 
    className={`${className} shadow`} 
    onClick={onClick} 
    aria-label={text} 
    title={title || text}
  >
    <i className={`bi bi-${icon}`}></i> {text}
  </button>
);

const Badge = ({ color, icon, text }) => (
  <span className={`badge bg-${color}`}>
    <i className={`bi bi-${icon}`} /> {text}
  </span>
);

const ActionCard = ({ borderColor, icon, color, text, onClick, hasTooltip, tooltip, dataTour, t }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className="btn p-0 border-0 bg-transparent text-start flex-fill" 
      data-tour={dataTour}
      aria-label={text}
      title={text}
    >
      <div className={`card h-100 shadow border border-${borderColor}`}>
        <div className="card-body d-flex flex-column justify-content-center align-items-center p-3 position-relative">
          {hasTooltip && (
            <div
              className="position-absolute top-0 end-0 m-1 p-1 text-info"
              style={{ cursor: 'help' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <i className="bi bi-info-circle"></i>
              {showTooltip && (
                <div 
                  className="position-absolute bg-dark text-white p-2 rounded shadow" 
                  style={{ 
                    top: '100%', 
                    right: '0', 
                    width: '200px', 
                    fontSize: '0.8rem', 
                    zIndex: 1050 
                  }}
                >
                  {tooltip}
                </div>
              )}
            </div>
          )}
          <i className={`bi bi-${icon} text-${color} fs-1`}></i>
          <p className={`text-${color} fw-bold mt-2 mb-0 text-center`}>
            {text}
          </p>
        </div>
      </div>
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
  fetchSuggestions,
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    // Focus automatique sur le champ name
    inputRef.current?.focus();
    // Scroll pour placer le champ en vue (le scroll-padding du HTML gère l'espace pour header/footer)
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSelect = (item) => {
    const onlyNumbers = parseInt(item.dose.replace(/\D/g, ''));
    onChangeName(item.name);
    onChangeDose(onlyNumbers);
    onChangeBoxCapacity(item.conditionnement);
    onChangeStockQuantity(item.conditionnement);
    setShowDropdown(false);
    setSuggestions([]);
    inputRef.current.value = item.name;
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

    const timeout = setTimeout(fetchData, 300); // anti-spam
    return () => clearTimeout(timeout);
  }, [name, dose]);

  return (
    <div className="position-relative d-flex mb-2 gap-2">
      <div className="w-50">
        <small className="text-muted">{t('boxes.name')}</small>
        <br />
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm w-75 scroll-target"
          defaultValue={name}
          onChange={(e) => {
            onChangeName(e.target.value);
            setShowDropdown(true);
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('boxes.start_typing')}
          aria-label={t('boxes.name')}
          title={t('boxes.name')}
        />
      </div>
      <div className="w-50">
        <small className="text-muted">{t('boxes.dose')}</small>
        <br />
        <input
          type="number"
          className="form-control form-control-sm w-75"
          value={dose}
          onChange={(e) => {
            onChangeDose(parseInt(e.target.value));
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          aria-label={t('boxes.dose')}
          title={t('boxes.dose')}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul
          className="dropdown-menu show position-absolute top-100 start-0 w-100"
          style={{ maxHeight: 200, overflowY: 'auto' }}
        >
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                className="dropdown-item text-wrap"
                onClick={() => handleSelect(item)}
              >
                {item.name} - {item.dose} - {item.conditionnement}{' '}
                {item.forme_pharmaceutique}
              </button>
            </li>
          ))}
        </ul>
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
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [singleScan, setSingleScan] = useState(false);
  const [currentEditingBoxId, setCurrentEditingBoxId] = useState(null);
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [editingBoxId, setEditingBoxId] = useState(null);
  const [editingBox, setEditingBox] = useState(null);

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
    isDemo ? () => {} : setLoadingBoxes
  );

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
  
  const showAlert = (msg, type) => {
    setAlertMessage(msg);
    setAlertType(type);
  };

  const handleApiResponse = (res, msg = null) => {
    if (res.success) {
      showAlert('✅ ' + (msg || res.message), 'success');
    } else {
      showAlert('❌ ' + res.error, 'danger');
    }
    return res.success;
  };

  const initEditing = (box) => {
    setEditingBoxId(box.id);
    setEditingBox({
      name: box.name,
      dose: box.dose,
      box_capacity: box.box_capacity,
      stock_alert_threshold: box.stock_alert_threshold,
      stock_quantity: box.stock_quantity,
      conditions: box.conditions.reduce(
        (acc, c) => ({
          ...acc,
          [c.id]: {
            ...c,
            max_date_mode: c.max_date 
              ? (c.max_date_days ? 'for_days' : 'until_date')
              : '',
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
      const res = await calendarSource.createBox(
        calendarId,
        editingBox.name,
        editingBox.box_capacity,
        editingBox.stock_alert_threshold,
        editingBox.stock_quantity,
        editingBox.dose
      );
      
      if (res.success) {
        // Supprimer la box temporaire et mettre à jour avec la vraie
        setBoxes(prev => prev.filter(b => b.id !== editingBoxId));
        handleApiResponse(res);
      } else {
        handleApiResponse(res);
      }
    } else {
      // Mise à jour d'une box existante
      const res = await calendarSource.updateBox(
        calendarId, 
        editingBoxId, 
        { ...editingBox, conditions }
      );
      handleApiResponse(res);
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
      med.dose
    );
    return res.success;
  };

  const addScannedMedicines = async (medicines) => {
    if (!medicines?.length) {
      showAlert('⚠️ Ajouter des médicaments', 'warning');
      return { success: false };
    }
    
    let success = 0;
    let error = 0;
    
    for (const med of medicines) {
      if (await processMedicineCreation(med)) {
        success++;
      } else {
        error++;
      }
    }
    
    setShowQRModal(false);
    
    if (error === 0) {
      showAlert('✅ Ajouté', 'success');
    } else if (success === 0) {
      showAlert('❌ Ajouter des médicaments', 'danger');
    } else {
      showAlert(`⚠️ ${success} ajouté(s), ${error} erreur(s)`, 'warning');
    }
    
    return { success: error === 0, successCount: success, errorCount: error };
  };

  const updateScannedMedicine = async (medicines) => {
    if (!medicines?.length || !currentEditingBoxId) {
      showAlert('⚠️ Ajouter un médicament', 'warning');
      return { success: false };
    }
    
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
        conditions: currentBox?.conditions || [],
      }
    );
    
    setShowQRModal(false);
    setCurrentEditingBoxId(null);
    setSingleScan(false);
    
    if (res.success) {
      showAlert('✅ Ajouté', 'success');
    } else {
      showAlert('❌ Ajouter un médicament', 'danger');
    }
    
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
            <i className="bi bi-download me-2" />
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
            <i className="bi bi-box-arrow-up me-2" />
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
              <i className="bi bi-exclamation-triangle me-2" />
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
            <i className="bi bi-calendar3 me-2" />
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
            <i className="bi bi-gear me-2" />
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
            <i className="bi bi-trash me-2" />
            {t('delete')}
          </>
        ),
        onClick: async () => {
          const r = await personalCalendars.deleteCalendar(calendarId);
          if (r.success) {
            navigate(`/${lng}/calendars`);
          } else {
            showAlert(r.error, 'danger');
          }
        },
        title: t('delete'),
        danger: true,
      });
    } else if (calendarType === 'sharedUser') {
      actions.push({
        label: (
          <>
            <i className="bi bi-trash3 me-2" />
            {t('delete')}
          </>
        ),
        onClick: () => sharedUserCalendars.deleteSharedCalendar(calendarId),
        title: t('delete'),
        danger: true,
      });
    }
    
    return actions;
  };

  // =========================================================================
  // LOADING STATES
  // =========================================================================
  
  if (loadingBoxes === undefined) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">
            {t('loading_medicines')}
          </span>
        </div>
      </div>
    );
  }

  if (loadingBoxes === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {t('invalid_or_expired_link')}
      </div>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      <div className="p-1 w-100" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center mb-3 flex-wrap"
          data-tour="stock-view-title"
        >
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-box-seam me-2"></i>
            {t('boxes.title')}
          </h4>
          <ActionSheet actions={getCommonActions()} />
        </div>

        {/* Alert System */}
        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => {
            setAlertMessage('');
            setAlertType('');
          }}
        />

        {/* Boxes Grid */}
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {boxes.map((box) => (
            <div className="col-12 col-md-6 mb-3" key={box.id}>
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
                    showAlert={showAlert}
                    handleApiResponse={handleApiResponse}
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
                  showAlert={showAlert}
                  handleApiResponse={handleApiResponse}
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
          <div className="col-12 col-md-6">
            <div className="d-flex flex-column gap-2 h-100">
              <ActionCard
                borderColor="success"
                icon="plus-circle"
                color="success"
                text={t('boxes.add_manual')}
                onClick={() => {
                  // Créer une nouvelle box temporaire localement
                  const tempId = `temp-${Date.now()}`;
                  const newBox = {
                    id: tempId,
                    name: t('boxes.new_box'),
                    dose: 0,
                    box_capacity: 0,
                    stock_quantity: 0,
                    stock_alert_threshold: 0,
                    conditions: [],
                  };
                  
                  // Ajouter la box au state local
                  setBoxes((prev) => [...prev, newBox]);
                  
                  // Mettre en mode édition
                  initEditing(newBox);
                  setExpandedBoxes((p) => ({
                    ...p,
                    [tempId]: true,
                  }));
                }}
                ariaLabel={t('boxes.add_manual')}
                hasTooltip={false}
                dataTour="add-manual-btn"
                t={t}
              />
              <ActionCard
                borderColor="primary"
                icon="qr-code-scan"
                color="primary"
                text={t('boxes.add_with_qr')}
                onClick={() => {
                  setSingleScan(false);
                  setCurrentEditingBoxId(null);
                  setShowQRModal(true);
                }}
                ariaLabel={t('boxes.add_with_qr')}
                hasTooltip={true}
                tooltip={t('boxes.qr_code_help_text')}
                dataTour="add-qr-btn"
                t={t}
              />
            </div>
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
  showAlert,
  handleApiResponse,
  onEdit,
  onUpdateScan,
  t,
}) {
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
        // Si interval_days devient <= 1, mettre start_date à null
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
        { value: '', label: t('boxes.condition.no_limit') },
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
          // Calculer la date de fin en fonction de la ou on se situe dans la journé
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
          max_date_mode: '',
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

  const restockBox = async () => {
    const r = await calendarSource.restockBox(calendarId, box.id);
    handleApiResponse(r);
  };

  const deleteBox = async () => {
    const r = await calendarSource.deleteBox(calendarId, box.id);
    handleApiResponse(r);
  };

  const getBoxActions = () => [
    {
      label: (
        <>
          <i className="bi bi-qr-code-scan me-2" />
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
          <i className="bi bi-pencil me-2" />
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
          <i className="bi bi-file-earmark-pdf me-2" />
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
          <i className="bi bi-trash me-2" />
          {t('boxes.delete')}
        </>
      ),
      onClick: deleteBox,
      title: t('boxes.delete'),
      danger: true,
    },
  ];

  const borderClass =
    box.box_capacity === 0
      ? ''
      : box.stock_quantity <= 0
      ? 'border-danger'
      : box.stock_quantity <= box.stock_alert_threshold
      ? 'border-warning'
      : '';

  // =========================================================================
  // RENDER BOX CARD
  // =========================================================================
  
  return (
    <div className={`card h-100 shadow border ${borderClass}`}>
      <div className="card-body position-relative">
        
        {/* Action Menu */}
        {!isEditing && (
          <div className="position-absolute top-0 end-0 m-2">
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
            fetchSuggestions={fetchSuggestions}
          />
        ) : (
          <h5 className="card-title fs-semibold mb-1">
            {`${box.name}${box.dose > 0 ? ' (' + box.dose + ' mg)' : ''}`}
          </h5>
        )}


        {/* Capacity and Alert Threshold */}
        <div className="d-flex mb-2 gap-2">
          <div className="w-50">
            <small className="text-muted">{t('boxes.capacity')}</small>
            <br />
            {isEditing ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                value={editingBox.box_capacity}
                onChange={(e) =>
                  setEditingBox((p) => ({
                    ...p,
                    box_capacity: parseInt(e.target.value),
                  }))
                }
                aria-label={t('boxes.capacity')}
                title={t('boxes.capacity')}
              />
            ) : (
              <strong>{box.box_capacity}</strong>
            )}
          </div>
          <div className="w-50">
            <small className="text-muted">{t('boxes.alert_threshold')}</small>
            <br />
            {isEditing ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                value={editingBox.stock_alert_threshold}
                onChange={(e) =>
                  setEditingBox((p) => ({
                    ...p,
                    stock_alert_threshold: parseInt(e.target.value),
                  }))
                }
                aria-label={t('boxes.alert_threshold')}
                title={t('boxes.alert_threshold')}
              />
            ) : (
              <strong>{box.stock_alert_threshold}</strong>
            )}
          </div>
        </div>

        {/* Stock Quantity and Restock Button */}
        <div className="d-flex mb-2 gap-2 align-items-center">
          <div className="w-50">
            <small className="text-muted">{t('boxes.remaining_qty')}</small>
            <br />
            {isEditing ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                value={editingBox.stock_quantity}
                onChange={(e) =>
                  setEditingBox((p) => ({
                    ...p,
                    stock_quantity: parseInt(e.target.value),
                  }))
                }
                aria-label={t('boxes.remaining_qty')}
                title={t('boxes.remaining_qty')}
              />
            ) : (
              <strong>{box.stock_quantity}</strong>
            )}
          </div>
          {!isEditing && (
            <div className="w-50">
              <IconButton
                className="btn btn-outline-success w-100"
                icon="plus-circle"
                text={t('boxes.restock')}
                onClick={restockBox}
              />
            </div>
          )}
        </div>

        {/* Stock Badges */}
        {!isEditing && (
          <div className="d-flex mb-2 align-items-center w-100 gap-2">
            {box.box_capacity !== 0 && (
              <Badge
                color={
                  box.stock_quantity <= 0
                    ? 'danger'
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? 'warning'
                    : 'success'
                }
                icon={
                  box.stock_quantity <= 0
                    ? 'exclamation-triangle'
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? 'exclamation-triangle'
                    : 'check-circle'
                }
                text={
                  box.stock_quantity <= 0
                    ? t('boxes.stock.badge.out')
                    : box.stock_quantity <= box.stock_alert_threshold
                    ? t('boxes.stock.badge.low')
                    : t('boxes.stock.badge.high')
                }
              />
            )}
            {box.conditions.filter((c) => c !== undefined).length === 0 && (
              <button
                className="btn p-0"
                onClick={() => {
                  setExpandedBoxes((p) => ({ ...p, [box.id]: true }));
                  onEdit(box);
                }}
                aria-label={t('boxes.condition.add')}
                title={t('boxes.condition.add')}
              >
                <Badge
                  color="warning"
                  icon="info-circle"
                  text={t('boxes.condition.none')}
                />
              </button>
            )}
            {/*medic expired (date max depasser)*/}
            {box.conditions.some((c) => {
              if (!c || !c.max_date) return false;
              const now = new Date();
              const maxDate = new Date(c.max_date);
              return now > maxDate;
            }) && (
              <Badge
                color="secondary"
                icon="exclamation-circle"
                text={t('boxes.condition.expired')}
              />
            )}
          </div>
        )}

        {/* Conditions Section */}
        <div className="mt-4 mb-2">
          <hr className="border-dark mb-0" />
          <h5 className="w-100">
            <button
              className="btn w-100 text-start d-flex justify-content-between align-items-center border-0 bg-transparent px-0 pb-0 mb-0"
              type="button"
              title={t('boxes.intake_conditions')}
              onClick={toggleExpand}
              data-tour="box-condition-toggle"
            >
              <span>{t('boxes.intake_conditions')}</span>
              <i
                className={`bi bi-chevron-${
                  expandedBoxes[box.id] ? 'up' : 'down'
                }`}
              ></i>
            </button>
          </h5>

          {expandedBoxes[box.id] && (
            <div className="mt-2">
              {isEditing ? (
                <>
                  {Object.values(editingBox.conditions || {})
                    .filter((c) => c !== undefined)
                    .map((cond) => (
                      <div
                        key={cond.id}
                        className="mb-2 p-3 border rounded bg-light shadow"
                      >
                        {conditionFields.map(
                          ({ label, field, type, min, step, format, options, ifComplete, onChange, required}, idx) => {
                            // Si ifComplete est défini et retourne false, ne pas afficher le champ
                            if (ifComplete && !ifComplete(cond)) {
                              return null;
                            }
                            
                            // Résoudre les valeurs dynamiques
                            const resolvedLabel = typeof label === 'function' ? label(cond) : label;
                            const resolvedField = typeof field === 'function' ? field(cond) : field;
                            const resolvedType = typeof type === 'function' ? type(cond) : type;
                            const resolvedFormat = typeof format === 'function' ? format(cond) : format;
                            const resolvedRequired = typeof required === 'function' ? required(cond) : required;
                            
                            return (
                            <div key={`${cond.id}-${resolvedField}-${idx}`}>
                              <label>{resolvedLabel}</label>
                              {resolvedType === 'select' ? (
                                <select
                                  className="form-control form-control-sm"
                                  value={cond[resolvedField] ?? ''}
                                  onChange={(e) => {
                                    updateCondition(cond.id, resolvedField, e.target.value);
                                    if (onChange) {
                                      onChange(cond, e.target.value, (f, v) => updateCondition(cond.id, f, v));
                                    }
                                  }}
                                  aria-label={resolvedLabel}
                                  title={resolvedLabel}
                                  required={resolvedRequired}
                                >
                                  {options.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={resolvedType}
                                  className="form-control form-control-sm"
                                  value={
                                    (resolvedField === 'start_date' || (resolvedField === 'max_date' && resolvedType === 'date')) && cond[resolvedField]
                                      ? new Date(cond[resolvedField])
                                          .toISOString()
                                          .split('T')[0]
                                      : cond[resolvedField] ?? ''
                                  }
                                  min={min}
                                  step={step}
                                  onChange={(e) => {
                                    let value = e.target.value;
                                    // Parser selon le format
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
                                  title={resolvedLabel}
                                  required={resolvedRequired}
                                />
                              )}
                            </div>
                          );
                          }
                        )}
                        <IconButton
                          className="btn btn-danger btn-sm mt-2"
                          icon="trash"
                          text={t('boxes.condition.delete')}
                          onClick={() => deleteCondition(cond.id)}
                        />
                      </div>
                    ))
                  }
                  <IconButton
                    className="btn btn-sm bg-light border w-100 mt-2"
                    icon="plus-lg"
                    text={t('boxes.condition.add')}
                    onClick={addCondition}
                  />
                </>
              ) : box.conditions.filter((c) => c !== undefined).length > 0 ? (
                box.conditions
                  .filter((c) => c !== undefined)
                  .map((cond) => (
                    <div
                      key={cond.id}
                      className="mb-3 p-3 border rounded bg-light shadow"
                    >
                      <strong>
                        {cond.tablet_count}{' '}
                        {cond.tablet_count > 1
                          ? t('boxes.tablets')
                          : t('boxes.tablet')}
                      </strong>{' '}
                      {t('boxes.every')}{' '}
                      <strong>
                        {cond.interval_days}{' '}
                        {cond.interval_days > 1
                          ? t('boxes.days')
                          : t('boxes.day')}
                      </strong>{' '}
                      {t('boxes.each')}{' '}
                      <strong>{timeOfDayMap[cond.time_of_day]}</strong>
                      {cond.interval_days > 1 && <br />}
                      {cond.interval_days > 1 && (
                        <small className="text-muted">
                          {t('boxes.from')}{' '}
                          {new Date(cond.start_date).toLocaleDateString()}
                        </small>
                      )}
                      {cond.max_date && <br />}
                      {cond.max_date && (
                        <small className="text-muted">
                          {t('boxes.until')}{' '}
                          {new Date(cond.max_date).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  ))
              ) : (
                <div className="border rounded bg-light d-flex justify-content-start align-items-center p-2 mb-2">
                  <p className="text-muted mb-0">
                    {t('boxes.condition.none')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <>
            <hr />
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-success btn-sm w-50"
                aria-label={t('boxes.save')}
                title={t('boxes.save')}
              >
                <i className="bi bi-save"></i> {t('boxes.save')}
              </button>
              <IconButton
                className="btn btn-secondary btn-sm w-50"
                icon="x"
                text={t('boxes.cancel')}
                onClick={onCancel}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BoxesView;
