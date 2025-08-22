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

const getBorderClass = (box) => {
  if (box.box_capacity === 0) return '';
  if (box.stock_quantity <= 0) return 'border-danger';
  if (box.stock_quantity <= box.stock_alert_threshold) return 'border-warning';
  return '';
};

const createAction = (icon, label, onClick, danger = false) => ({
  label: (
    <>
      <i className={`bi bi-${icon} me-2`} /> {label}
    </>
  ),
  onClick,
  danger
});

const createSeparator = () => ({ separator: true });

const createIconButton = (className, icon, text, onClick, ariaLabel, title) => (
  <button
    type="button"
    className={className}
    onClick={onClick}
    aria-label={ariaLabel || text}
    title={title || text}
  >
    <i className={`bi bi-${icon}`}></i> {text}
  </button>
);

const isSafeKey = (key) => (
  typeof key === 'string' &&
  /^\w+$/.test(key) &&
  key !== '__proto__' &&
  key !== 'prototype' &&
  key !== 'constructor'
);

const createBadge = (bgColor, icon, text) => (
  <span className={`badge bg-${bgColor}`}>
    <i className={`bi bi-${icon}`} /> {text}
  </span>
);

const createActionCard = (borderColor, iconClass, textColor, text, onClick, ariaLabel, hasTooltip, showTooltip, setShowTooltip, t) => (
  <button
    type="button"
    onClick={onClick}
    className="btn p-0 border-0 bg-transparent text-start flex-fill"
    style={{ cursor: 'pointer' }}
    aria-label={ariaLabel}
    title={ariaLabel}
  >
    <div className={`card h-100 shadow border border-${borderColor}`}>
      <div className={`card-body d-flex flex-column justify-content-center align-items-center p-3 ${hasTooltip ? 'position-relative' : ''}`}>
        {hasTooltip && (
          <button
            type="button"
            className="btn btn-link position-absolute top-0 end-0 m-1 p-1 text-info"
            style={{ fontSize: '1.2rem' }}
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
                {t('boxes.qr_code_help_text')}
              </div>
            )}
          </button>
        )}
        <i className={`${iconClass} ${textColor} fs-1`}></i>
        <p className={`${textColor} fw-bold mt-2 mb-0 text-center`}>{text}</p>
      </div>
    </div>
  </button>
);

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const lng = params.lng;
  const { t } = useTranslation();

  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  
  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
  };

  const handleApiResponse = (res, successMessage = null) => {
    if (res.success) {
      showAlert('✅ ' + (successMessage || res.message), 'success');
    } else {
      showAlert('❌ ' + res.error, 'danger');
    }
    return res.success;
  };

  const getCommonActions = (calendarType) => {
    const actions = [];
    
    actions.push(createAction('download', t('boxes.export_pdf'), () => calendarSource.downloadCalendarPdf(calendarId)));
    
    if (calendarType === 'personal') {
      actions.unshift(createAction('box-arrow-up', t('share'), () => navigate(`/${lng}/shared-calendars?calendar=${calendarId}`)));
      actions.push(
        createSeparator(),
        createAction('exclamation-triangle', t('stock'), () => navigate(`/${lng}/${basePath}/${calendarId}/stock-alerts`))
      );
    }
    
    actions.push(
      createSeparator(),
      createAction('gear', t('settings.label'), () => navigate(`/${lng}/${basePath}/${calendarId}/settings`)),
      createSeparator()
    );
    
    if (calendarType === 'personal') {
      actions.push(createAction('trash', t('delete'), async () => {
        const rep = await personalCalendars.deleteCalendar(calendarId);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        } else {
          showAlert(rep.error, 'danger');
        }
      }, true));
    } else if (calendarType === 'sharedUser') {
      actions.push(createAction('trash3', t('delete'), () => sharedUserCalendars.deleteSharedCalendar(calendarId), true));
    }
    
    return actions;
  };
  const [selectedModifyBox, setSelectedModifyBox] = useState(null);
  const [selectedDropBox, setSelectedDropBox] = useState({});
  const [modifyBoxName, setModifyBoxName] = useState({});
  const [modifyBoxCapacity, setModifyBoxCapacity] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [singleScan, setSingleScan] = useState(false); // true pour update, false pour add
  const [currentEditingBoxId, setCurrentEditingBoxId] = useState(null); // ID de la boîte en cours d'édition
  const [modifyBoxStockAlertThreshold, setModifyBoxStockAlertThreshold] =
    useState({});
  const [modifyBoxStockQuantity, setModifyBoxStockQuantity] = useState({});
  const [boxConditions, setBoxConditions] = useState({});
  const [dose, setDose] = useState({});

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
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

  useRealtimeBoxesSwitcher(calendarType, calendarId, setBoxes, setLoadingBoxes);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const boxConditionsForSelected = isSafeKey(selectedModifyBox)
      ? Object.getOwnPropertyDescriptor(boxConditions, selectedModifyBox)?.value || {}
      : {};
    const conditions = Object.values(boxConditionsForSelected).filter(
      (condition) => condition !== undefined
    );
    
    // Séparer les nouvelles conditions des conditions existantes
    const processedConditions = conditions.map(condition => {
      // Si l'ID commence par "temp_", c'est une nouvelle condition
      if (condition.id && condition.id.startsWith('temp_')) {
        // Ne pas envoyer l'ID pour les nouvelles conditions
        const conditionWithoutId = Object.fromEntries(
          Object.entries(condition).filter(([key]) => key !== 'id')
        );
        return conditionWithoutId;
      }
      // Pour les conditions existantes, garder l'ID
      return condition;
    });
    
    const box = {
      name: modifyBoxName[selectedModifyBox],
      dose: dose[selectedModifyBox],
      box_capacity: modifyBoxCapacity[selectedModifyBox],
      stock_alert_threshold: modifyBoxStockAlertThreshold[selectedModifyBox],
      stock_quantity: modifyBoxStockQuantity[selectedModifyBox],
      conditions: processedConditions,
    };
    const res = await calendarSource.updateBox(
      calendarId,
      selectedModifyBox,
      box
    );
    handleApiResponse(res);
    setSelectedModifyBox(null);
  };

  const restockBox = async (boxId) => {
    const res = await calendarSource.restockBox(calendarId, boxId);
    handleApiResponse(res);
  };

  const addBox = async () => {
    const res = await calendarSource.createBox(calendarId, t('boxes.new_box'));
    if (res.success) {
      setSelectedModifyBox(res.boxId);
      setSelectedDropBox((prev) => ({ ...prev, [res.boxId]: true }));
    }
  };

  const processMedicineCreation = async (medicineBox) => {
    try {
      const res = await calendarSource.createBox(
        calendarId,
        medicineBox.name,
        medicineBox.box_capacity,
        medicineBox.stock_alert_threshold,
        medicineBox.stock_quantity,
        medicineBox.dose
      );
      return res.success;
    } catch (error) {
      console.error('Erreur création boîte:', error);
      return false;
    }
  };

  const addScannedMedicines = async (medicineBoxes) => {
    if (!medicineBoxes || medicineBoxes.length === 0) {
      showAlert('⚠️ Ajouter des médicaments', 'warning');
      return { success: false };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const medicineBox of medicineBoxes) {
      const success = await processMedicineCreation(medicineBox);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setShowQRModal(false);

    if (errorCount === 0) {
      showAlert('✅ Ajouté', 'success');
      return { success: true, successCount, errorCount };
    } else if (successCount === 0) {
      showAlert('❌ Ajouter des médicaments', 'danger');
      return { success: false, successCount, errorCount };
    } else {
      showAlert(`⚠️ ${successCount} ajouté(s), ${errorCount} erreur(s)`, 'warning');
      return { success: true, successCount, errorCount };
    }
  };

  const updateScannedMedicine = async (medicineBoxes) => {
    if (!medicineBoxes || medicineBoxes.length === 0 || !currentEditingBoxId) {
      showAlert('⚠️ Ajouter un médicament', 'warning');
      return { success: false };
    }

    const medicineBox = medicineBoxes[0];
    try {
      const box = {
        name: medicineBox.name,
        dose: medicineBox.dose,
        box_capacity: medicineBox.box_capacity,
        stock_alert_threshold: medicineBox.stock_alert_threshold,
        stock_quantity: medicineBox.stock_quantity,
        conditions: [],
      };
      
      const res = await calendarSource.updateBox(calendarId, currentEditingBoxId, box);
      
      setShowQRModal(false);
      setCurrentEditingBoxId(null);
      setSingleScan(false);
      
      if (res.success) {
        showAlert('✅ Ajouté', 'success');
        return { success: true, successCount: 1, errorCount: 0 };
      } else {
        showAlert('❌ Ajouter un médicament', 'danger');
        return { success: false, successCount: 0, errorCount: 1 };
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showAlert('❌ Ajouter un médicament', 'danger');
      return { success: false, successCount: 0, errorCount: 1 };
    }
  };

  const openAddMode = () => {
    setSingleScan(false);
    setCurrentEditingBoxId(null);
    setShowQRModal(true);
  };

  const openUpdateMode = (boxId) => {
    setSingleScan(true);
    setCurrentEditingBoxId(boxId);
    setShowQRModal(true);
  };

  const deleteBox = async (boxId) => {
    const res = await calendarSource.deleteBox(calendarId, boxId);
    handleApiResponse(res);
  };

  const initializeBoxStates = (boxes) => {
    const createStateFromBoxes = (field, defaultValue = {}) => 
      boxes.reduce((acc, box) => ({ ...acc, [box.id]: box[field] }), defaultValue);

    setModifyBoxName(createStateFromBoxes('name'));
    setDose(createStateFromBoxes('dose'));
    setModifyBoxCapacity(createStateFromBoxes('box_capacity'));
    setModifyBoxStockAlertThreshold(createStateFromBoxes('stock_alert_threshold'));
    setModifyBoxStockQuantity(createStateFromBoxes('stock_quantity'));
    setBoxConditions(
      boxes.reduce(
        (acc, box) => ({
          ...acc,
          [box.id]: box.conditions.reduce(
            (condAcc, condition) => ({ ...condAcc, [condition.id]: condition }),
            {}
          ),
        }),
        {}
      )
    );
  };

  useEffect(() => {
    if (boxes.length > 0) {
      initializeBoxStates(boxes);
    }
  }, [boxes]);

  if (loadingBoxes === undefined) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('loading_medicines')}</span>
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

  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      <div className="p-1 w-100" style={{ maxWidth: '800px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-box-seam me-2"></i> {t('boxes.title')}
          </h4>
          <div className="ms-auto">
            {calendarType === 'personal' && (
              <ActionSheet actions={getCommonActions('personal')} />
            )}
            {calendarType === 'sharedUser' && (
              <ActionSheet actions={getCommonActions('sharedUser')} />
            )}
          </div>
        </div>



        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => {
            setAlertMessage('');
            setAlertType('');
          }}
        />
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {boxes.map((box) => (
            <div className="col-12 col-md-6 mb-3" key={box.id}>
              {selectedModifyBox && selectedModifyBox === box.id ? (
                <form onSubmit={handleSubmit}>
                  <BoxCard
                    box={box}
                    selectedModifyBox={selectedModifyBox}
                    setSelectedModifyBox={setSelectedModifyBox}
                    setModifyBoxName={setModifyBoxName}
                    modifyBoxName={modifyBoxName}
                    setModifyBoxCapacity={setModifyBoxCapacity}
                    modifyBoxCapacity={modifyBoxCapacity}
                    setModifyBoxStockAlertThreshold={
                      setModifyBoxStockAlertThreshold
                    }
                    modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                    setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                    modifyBoxStockQuantity={modifyBoxStockQuantity}
                    restockBox={restockBox}
                    deleteBox={deleteBox}
                    selectedDropBox={selectedDropBox}
                    setSelectedDropBox={setSelectedDropBox}
                    boxConditions={boxConditions}
                    setBoxConditions={setBoxConditions}
                    setDose={setDose}
                    dose={dose}
                    openUpdateMode={openUpdateMode}
                  />
                </form>
              ) : (
                <BoxCard
                  box={box}
                  selectedModifyBox={selectedModifyBox}
                  setSelectedModifyBox={setSelectedModifyBox}
                  setModifyBoxName={setModifyBoxName}
                  modifyBoxName={modifyBoxName}
                  setModifyBoxCapacity={setModifyBoxCapacity}
                  modifyBoxCapacity={modifyBoxCapacity}
                  setModifyBoxStockAlertThreshold={
                    setModifyBoxStockAlertThreshold
                  }
                  modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                  setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                  modifyBoxStockQuantity={modifyBoxStockQuantity}
                  restockBox={restockBox}
                  deleteBox={deleteBox}
                  selectedDropBox={selectedDropBox}
                  setSelectedDropBox={setSelectedDropBox}
                  boxConditions={boxConditions}
                  setBoxConditions={setBoxConditions}
                  setDose={setDose}
                  dose={dose}
                  openUpdateMode={openUpdateMode}
                />
              )}
            </div>
          ))}
          <div className="col-12 col-md-6 mb-3">
            <div className="d-flex flex-column gap-2 h-100">
              {createActionCard(
                'success',
                'bi bi-plus-circle',
                'text-success',
                t('boxes.add_manual'),
                () => addBox(),
                t('boxes.add_manual'),
                false,
                showTooltip,
                setShowTooltip,
                t
              )}
              {createActionCard(
                'primary',
                'bi bi-qr-code-scan',
                'text-primary',
                t('boxes.add_with_qr'),
                openAddMode,
                t('boxes.add_with_qr'),
                true,
                showTooltip,
                setShowTooltip,
                t
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Composant QRCodeScanner avec modal intégrée */}
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

function BoxCard({
  box,
  selectedModifyBox,
  setSelectedModifyBox,
  setModifyBoxName,
  modifyBoxName,
  setModifyBoxCapacity,
  modifyBoxCapacity,
  setModifyBoxStockAlertThreshold,
  modifyBoxStockAlertThreshold,
  setModifyBoxStockQuantity,
  modifyBoxStockQuantity,
  restockBox,
  deleteBox,
  selectedDropBox,
  setSelectedDropBox,
  boxConditions,
  setBoxConditions,
  setDose,
  dose,
  openUpdateMode
}) {
  const { t } = useTranslation();

  const getBoxActions = () => [
    {
      label: (
        <>
          <i className="bi bi-qr-code-scan me-2" /> {t('boxes.scan_qr_code')}
        </>
      ),
      onClick: () => openUpdateMode(box.id),
    },
    { separator: true },
    {
      label: (
        <>
          <i className="bi bi-pencil me-2" /> {t('boxes.edit')}
        </>
      ),
      onClick: () => setSelectedModifyBox(box.id),
    },
    {
      label: (
        <>
          <i className="bi bi-file-earmark-pdf me-2" /> {t('boxes.view_notice')}
        </>
      ),
      onClick: () => openNotice(box.id),
    },
    { separator: true },
    {
      label: (
        <>
          <i className="bi bi-trash me-2" /> {t('boxes.delete')}
        </>
      ),
      onClick: () => deleteBox(box.id),
      danger: true,
    },
  ];

  const resetModificationStates = () => {
    setSelectedModifyBox(null);
    setModifyBoxName({ ...modifyBoxName, [box.id]: box.name });
    setModifyBoxCapacity({ ...modifyBoxCapacity, [box.id]: box.box_capacity });
    setModifyBoxStockAlertThreshold({ ...modifyBoxStockAlertThreshold, [box.id]: box.stock_alert_threshold });
    setModifyBoxStockQuantity({ ...modifyBoxStockQuantity, [box.id]: box.stock_quantity });
    setBoxConditions({
      ...boxConditions,
      [box.id]: box.conditions.reduce(
        (acc, condition) => ({ ...acc, [condition.id]: condition }),
        {}
      ),
    });
    setDose({ ...dose, [box.id]: box.dose });
  };

  const addNewCondition = () => {
    const id = `temp_${uuidv4()}`;
    setBoxConditions((prev) => ({
      ...prev,
      [box.id]: {
        ...prev[box.id],
        [id]: {
          id,
          tablet_count: 1,
          interval_days: 1,
          start_date: null,
          time_of_day: 'morning',
        },
      },
    }));
    setSelectedModifyBox(box.id);
  };

  const deleteCondition = (conditionId) => {
    setBoxConditions((prev) => ({
      ...prev,
      [box.id]: {
        ...prev[box.id],
        [conditionId]: undefined,
      },
    }));
  };

  const handleConditionChange = (conditionId, field, value) => {
    setBoxConditions((prev) => ({
      ...prev,
      [box.id]: {
        ...prev[box.id],
        [conditionId]: {
          ...prev[box.id][conditionId],
          [field]: value,
        },
      },
    }));
  };

  const editable = selectedModifyBox === box.id;
  const timeOfDayMap = {
    morning: t('morning'),
    noon: t('noon'),
    evening: t('evening'),
  };

  const getConditionFields = (condition) => [
    {
      label: t('boxes.condition.tablet_count'),
      field: 'tablet_count',
      type: 'number',
      min: '0',
      step: '0.25',
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
    }, 
    {
      label: t('boxes.condition.interval_days'),
      field: 'interval_days',
      type: 'number',
      min: '0',
      step: '1',
    }, 
    {
      label: t('boxes.condition.start_date'),
      field: 'start_date',
      type: 'date',
      disabled: condition.interval_days === 1,
    }
  ];

  const getDisplayValue = (field, value, options = null) => {
    if (!value && value !== 0) return '-';
    
    if (options) {
      const option = options.find(opt => opt.value === value);
      return option?.label || value;
    }
    
    if (field === 'time_of_day') {
      return timeOfDayMap[value] || value;
    }
    
    return value;
  };

  const openNotice = (box_id) => {
    const url = `${import.meta.env.VITE_API_URL}/api/proxy/pdf/${box_id}`;
    window.open(url, '_blank');
  };

  const toggleDrop = () =>
    setSelectedDropBox((prev) => ({ ...prev, [box.id]: !prev[box.id] }));

  const borderClass = getBorderClass(box);

  return (
    <div className={`card h-100 shadow border ${borderClass}`}>
      <div className="card-body position-relative">
      <div className="position-absolute top-0 end-0 m-2">
        {(!selectedModifyBox || selectedModifyBox !== box.id) && (
          <ActionSheet
            buttonSize="sm"
            actions={getBoxActions()}
          />
        )}
      </div>

      <h5 className="card-title fs-semibold mb-1">
        {selectedModifyBox && selectedModifyBox === box.id ? (
          <InputDropdown
            name={modifyBoxName[box.id]}
            dose={dose[box.id]}
            onChangeName={(newName) =>
              setModifyBoxName({ ...modifyBoxName, [box.id]: newName })
            }
            onChangeDose={(newDose) =>
              setDose({ ...dose, [box.id]: newDose })
            }
            onChangeBoxCapacity={(newBoxCapacity) =>
              setModifyBoxCapacity({
                ...modifyBoxCapacity,
                [box.id]: newBoxCapacity,
              })
            }
            onChangeStockQuantity={(newStockQuantity) =>
              setModifyBoxStockQuantity({
                ...modifyBoxStockQuantity,
                [box.id]: newStockQuantity,
              })
            }
            fetchSuggestions={fetchSuggestions}
          />
        ) : (
          modifyBoxName[box.id] +
          (dose[box.id] > 0 ? ' (' + dose[box.id] + ' mg)' : '')
        )}
      </h5>

      <div className="d-flex mb-2 gap-2">
        {[{
          label: t('boxes.capacity'),
          field: 'box_capacity',
          value: modifyBoxCapacity[box.id],
          onChange: (e) =>
            setModifyBoxCapacity({
              ...modifyBoxCapacity,
              [box.id]: e.target.value,
            }),
        }, {
          label: t('boxes.alert_threshold'),
          field: 'stock_alert_threshold',
          value: modifyBoxStockAlertThreshold[box.id],
          onChange: (e) =>
            setModifyBoxStockAlertThreshold({
              ...modifyBoxStockAlertThreshold,
              [box.id]: e.target.value,
            }),
        }].map(({ label, field, value, onChange }) => (
          <BoxField
            key={field}
            type="number"
            label={label}
            value={value}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="d-flex mb-2 gap-2 align-items-center">
        <BoxField
          type="number"
          label={t('boxes.remaining_qty')}
          value={modifyBoxStockQuantity[box.id]}
          editable={editable}
          onChange={(e) =>
            setModifyBoxStockQuantity({
              ...modifyBoxStockQuantity,
              [box.id]: e.target.value,
            })
          }
        />
        {(!selectedModifyBox || selectedModifyBox !== box.id) && (
          <>
            <div className="w-50">
              {createIconButton(
                "btn btn-outline-success",
                "plus-circle",
                t('boxes.restock'),
                () => restockBox(box.id),
                t('boxes.restock'),
                t('boxes.restock')
              )}
            </div>
          </>
        )}
      </div>

      {(!selectedModifyBox || selectedModifyBox !== box.id) && (
        <div className="d-flex mb-2 align-items-center w-100 gap-2">
          <StockBadge box={box} />
          <ConditionUnlessBadge 
            conditions={box.conditions} 
            boxId={box.id} 
            setSelectedDropBox={setSelectedDropBox}
            setSelectedModifyBox={setSelectedModifyBox}
          />
        </div> 
      )}

      <div className="mt-4 mb-2">
        <hr className="border-dark mb-0" />
        <h5 className="w-100">
          <button
            className="btn w-100 text-start d-flex justify-content-between align-items-center border-0 bg-transparent px-0 pb-0 mb-0"
            type="button"
            title={t('boxes.intake_conditions')}
            aria-label={t('boxes.intake_conditions')}
              onClick={toggleDrop}
          >
            <span>{t('boxes.intake_conditions')}</span>
            <i
              className={`bi bi-chevron-${selectedDropBox[box.id] === true ? 'up' : 'down'}`}
            ></i>
          </button>
        </h5>

        {/* Condition de prise */}
        {selectedDropBox[box.id] === true && (
          <div className="mt-2">
            {editable ? (
              <>
                {Object.values(boxConditions[box.id] || {})
                  .filter((condition) => condition !== undefined)
                  .map((condition) => (
                    <div key={condition.id}>
                      <div className="mb-2 p-3 border rounded bg-light">
                        {getConditionFields(condition).map(({ label, field, type, min, step, options, disabled }) => (
                          <div key={field}>
                            <label htmlFor={field}>{label}</label>
                            {type === 'select' ? (
                              <select
                                className="form-control form-control-sm"
                                defaultValue={condition[field]}
                                title={label}
                                aria-label={label}
                                onChange={(e) => handleConditionChange(condition.id, field, e.target.value)}
                              >
                                {options.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={type}
                                className="form-control form-control-sm"
                                defaultValue={
                                  field === 'start_date' && condition.start_date
                                    ? new Date(condition.start_date).toISOString().split('T')[0]
                                    : condition[field]
                                }
                                title={label}
                                aria-label={label}
                                min={min}
                                step={step}
                                disabled={disabled}
                                onChange={(e) => handleConditionChange(condition.id, field, e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                        {createIconButton(
                          "btn btn-danger btn-sm mt-2",
                          "trash",
                          t('boxes.condition.delete'),
                          () => deleteCondition(condition.id),
                          t('boxes.condition.delete'),
                          t('boxes.condition.delete')
                        )}
                      </div>
                    </div>
                  ))}

                {createIconButton(
                  "btn btn-outline-dark w-100",
                  "plus-lg",
                  t('boxes.condition.add'),
                  addNewCondition
                )}
              </>
            ) : Object.values(box.conditions).filter(
                (condition) => condition !== undefined
              ).length > 0 ? (
              Object.values(box.conditions)
                .filter((condition) => condition !== undefined)
                .map((condition) => (
                  <div
                    className="mb-2 p-3 border rounded bg-light"
                    key={condition.id}
                  >
                    <strong>
                      {condition.tablet_count}{' '}
                      {condition.tablet_count > 1 ? t('boxes.tablets') : t('boxes.tablet')}
                    </strong>{' '}
                    {t('boxes.every')} {' '}
                    <strong>
                      {condition.interval_days}{' '}
                      {condition.interval_days > 1 ? t('boxes.days') : t('boxes.day')}
                    </strong>{' '}
                    {t('boxes.each')} {' '}
                    <strong>{getDisplayValue('time_of_day', condition.time_of_day)}</strong>
                    <br />
                    {condition.interval_days > 1 && (
                      <small className="text-muted">
                        {t('boxes.from')} {' '}
                        {new Date(condition.start_date).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                ))
            ) : (
              <div className="border rounded bg-light d-flex justify-content-start align-items-center p-2 mb-2">
                <p className="text-muted mb-0">{t('boxes.condition.none')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedModifyBox && selectedModifyBox === box.id && (
        <>
          <hr />
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-success btn-sm"
              aria-label={t('boxes.save')}
              title={t('boxes.save')}
            >
              <i className="bi bi-save"></i> {t('boxes.save')}
            </button>
            {createIconButton(
              "btn btn-secondary btn-sm",
              "x",
              t('boxes.cancel'),
              resetModificationStates,
              t('boxes.cancel'),
              t('boxes.cancel')
            )}
          </div>
        </>
      )}
    </div>
  </div>
);
}

function BoxField({
  type,
  label,
  value,
  editable,
  onChange,
  onFocus = null,
  onBlur = null,
  onClick = null,
}) {
  return (
    <div className="w-50">
      <small className="text-muted">{label}</small>
      <br />
      {editable ? (
        <input
          type={type}
          aria-label={label}
          className="form-control form-control-sm w-75"
          value={value}
          onChange={onChange}
          required
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
        />
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function StockBadge({ box }) {
  const { t } = useTranslation();
  
  if (box.box_capacity === 0) return null;

  if (box.stock_quantity <= 0) {
    return createBadge('danger', 'exclamation-triangle', t('boxes.stock.badge.out'));
  }

  if (box.stock_quantity <= box.stock_alert_threshold) {
    return createBadge('warning', 'exclamation-triangle', t('boxes.stock.badge.low'));
  }

  return createBadge('success', 'check-circle', t('boxes.stock.badge.high'));
}

function ConditionUnlessBadge({ conditions, boxId, setSelectedDropBox, setSelectedModifyBox }) {
  const { t } = useTranslation();

  const hasNoConditions =
    Object.values(conditions || {}).filter((c) => c !== undefined).length === 0;

  return hasNoConditions ? (
    <button 
      className='btn p-0' 
      onClick={() => {
        setSelectedDropBox((prev) => ({ ...prev, [boxId]: true }));
        setSelectedModifyBox(boxId)
      }}
    >
      {createBadge('warning', 'info-circle', t('boxes.condition.none'))}
    </button>
  ) : null;
}

function InputDropdown({
  name,
  dose,
  onChangeName,
  onChangeDose,
  onChangeBoxCapacity,
  onChangeStockQuantity,
  fetchSuggestions,
}) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();

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
    <div className="position-relative w-100 d-flex gap-2">
      <div className="w-50">
        <small className="text-muted">{t('boxes.name')}</small>
        <br />
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          defaultValue={name}
          onChange={(e) => {
            onChangeName(e.target.value);
            setShowDropdown(true)
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('boxes.start_typing')}
        />
      </div>
      <BoxField
        type="number"
        label={t('boxes.dose')}
        value={dose}
        editable={true}
        onChange={(e) => {
          onChangeDose(parseInt(e.target.value));
        }}
        onClick={() => setTimeout(() => setShowDropdown(true), 300)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />
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
}

export default BoxesView;
