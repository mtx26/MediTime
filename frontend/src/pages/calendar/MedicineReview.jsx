import { fetchSuggestions } from '../../utils/api/fetchSuggestions';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ActionSheet from '../../components/common/ActionSheet';
import { useTranslation } from 'react-i18next';

const DEFAULT_CONDITION = {
  time_of_day: '',
  interval_days: '',
  start_date: '',
  tablet_count: '',
};

export default function MedicineReview() {
  const location = useLocation();
  const { t } = useTranslation();
  const medicineBoxes = location.state?.importedMedicines ?? [];

  const [medicines, setMedicines] = useState(medicineBoxes);
  const [editMode, setEditMode] = useState(false);
  const [initialMissing, setInitialMissing] = useState(new Set());

  const [index, setIndex] = useState(0);
  const current = medicines[index];
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const isMissing = (v) => !v?.toString().trim();

  const isConditionFieldMissing = (field, cond) => {
    if (field === 'start_date') {
      return parseInt(cond.interval_days) > 1 && isMissing(cond.start_date);
    }
    // Pour time_of_day, on considère que c'est manquant si c'est vide ou la valeur par défaut
    if (field === 'time_of_day') {
      return !cond[field] || cond[field] === '' || cond[field].toString().trim() === '';
    }
    return isMissing(cond[field]);
  };

  // Créer une clé unique pour identifier un champ
  const getFieldKey = (medicineIndex, field, conditionIndex = null) => {
    return conditionIndex !== null 
      ? `${medicineIndex}_condition_${conditionIndex}_${field}`
      : `${medicineIndex}_${field}`;
  };

  // Vérifier si un champ a été marqué comme initialement manquant
  const wasInitiallyMissing = (medicineIndex, field, conditionIndex = null) => {
    const key = getFieldKey(medicineIndex, field, conditionIndex);
    return initialMissing.has(key);
  };

  // Marquer un champ comme manquant
  const markAsMissing = (medicineIndex, field, conditionIndex = null) => {
    const key = getFieldKey(medicineIndex, field, conditionIndex);
    setInitialMissing(prev => new Set([...prev, key]));
  };

  const handleChange = (field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleConditionChange = (i, field, value) => {
    const updated = [...medicines];
    updated[index].conditions[i][field] = value;
    setMedicines(updated);
  };

  const addCondition = () => {
    const updated = [...medicines];
    updated[index].conditions.push({ ...DEFAULT_CONDITION });
    setMedicines(updated);
  };

  const isCurrentValid = () => {
    const mainFieldsFilled =
      current.name.trim() &&
      current.dose.toString().trim();

    const conditionsValid = current.conditions.every((cond) =>
      !['time_of_day', 'interval_days', 'tablet_count', 'start_date'].some((field) =>
        isConditionFieldMissing(field, cond)
      )
    );

    return mainFieldsFilled && conditionsValid;
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
    setEditMode(false);
  };

  const goNext = () => {
    if (index < medicines.length - 1) setIndex(index + 1);
    setEditMode(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Réinitialiser le mode édition à false quand on change de médicament
    setEditMode(false);
  }, [index]);

  useEffect(() => {
    const updated = [...medicines];
    const med = updated[index];

    // Si les champs n'existent pas, on les initialise
    if (med.stock_quantity === undefined) med.stock_quantity = '';
    if (med.stock_max === undefined) med.stock_max = '';
    if (med.stock_alert_threshold === undefined) med.stock_alert_threshold = '';
    if (!Array.isArray(med.conditions)) med.conditions = [];

    setMedicines(updated);
  }, [index]);

  // Surveiller les champs manquants et les ajouter à initialMissing
  useEffect(() => {
    if (!current) return;

    // Vérifier le nom
    if (isMissing(current.name)) {
      markAsMissing(index, 'name');
    }

    // Vérifier le dosage
    if (isMissing(current.dose)) {
      markAsMissing(index, 'dose');
    }

    // Vérifier les conditions
    if (current.conditions) {
      current.conditions.forEach((cond, condIndex) => {
        ['time_of_day', 'interval_days', 'tablet_count', 'start_date'].forEach(field => {
          if (isConditionFieldMissing(field, cond)) {
            markAsMissing(index, field, condIndex);
          }
        });
      });
    }
  }, [current, index, medicines]);

  useEffect(() => {
    if (!current.name || current.name.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await fetchSuggestions(current.name, current.dose);
      setSuggestions(results || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [current.name, current.dose]);

  // Fonction pour obtenir la valeur affichée d'un champ
  const getDisplayValue = (field, value, options = null) => {
    if (!value && value !== 0) return '-';
    
    if (options) {
      const option = options.find(opt => opt.value === value);
      return option?.label || value;
    }
    
    if (field === 'time_of_day') {
      const timeOptions = {
        'morning': 'Matin',
        'noon': 'Midi', 
        'evening': 'Soir'
      };
      return timeOptions[value] || value;
    }
    
    return value;
  };

  // Actions pour l'ActionSheet
  const actionSheetActions = [
    {
      label: (
        <>
          <i className="bi bi-pencil me-2"></i>
          Modifier
        </>
      ),
      onClick: () => setEditMode(true),
    },
  ];



  return (
    <div className="text-center">
      <div className="card mx-auto shadow p-4 mb-4" style={{ maxWidth: 500 }}>
        {/* Header avec ActionSheet */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Révision du médicament</h6>
          {!editMode && (
            <ActionSheet 
              actions={actionSheetActions}
            />
          )}
        </div>
        
        <div className="row mb-3">
          <div className="col-6 position-relative mb-3 text-start">
            <label htmlFor="name">Nom :</label><br />
            {wasInitiallyMissing(index, 'name') || editMode ? (
              <input
                type="text"
                className={`form-control form-control-sm ${isMissing(current.name) ? 'is-invalid' : ''}`}
                value={current.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  setShowDropdown(true);
                }}
                onClick={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Commencez à taper..."
              />
            ) : (
              <div className="form-control form-control-sm bg-light border">
                <strong>{current.name}</strong>
              </div>
            )}
            {editMode && showDropdown && suggestions.length > 0 && (
              <ul className="dropdown-menu show w-100 position-absolute top-100 start-0 z-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {suggestions.map((item, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="dropdown-item text-wrap"
                      onClick={() => {
                        const onlyNumbers = parseInt(item.dose.replace(/\D/g, ''));
                        handleChange('name', item.name);
                        handleChange('dose', onlyNumbers);
                        handleChange('stock_max', item.conditionnement);
                        handleChange('stock_quantity', item.conditionnement);
                        setShowDropdown(false);
                        setSuggestions([]);
                      }}
                    >
                    {item.name} - {item.dose} - {item.conditionnement}{' '}
                    {item.forme_pharmaceutique}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-12 col-md-6 mb-3 text-start">
            <label htmlFor="dose">Dosage :</label><br />
            {wasInitiallyMissing(index, 'dose') || editMode ? (
              <input
                className={`form-control form-control-sm ${isMissing(current.dose) ? 'is-invalid' : ''}`}
                type="number"
                value={current.dose}
                onChange={(e) => handleChange('dose', e.target.value)}
                id="dose"
                placeholder="mg"
                title="Dosage"
                aria-label="Dosage"
                min={0}
              />
            ) : (
              <div className="form-control form-control-sm bg-light border">
                <strong>{current.dose} mg</strong>
              </div>
            )}
          </div>

          {[{
            label: 'Stock actuel',
            field: 'stock_quantity',
            type: 'number',
            required: false,
          }, {
            label: 'Stock maximum',
            field: 'stock_max',
            type: 'number',
            min: '0',
            required: false,
          }, {
            label: "Seuil d'alerte",
            field: 'stock_alert_threshold',
            type: 'number',
            min: '0',
            required: false,
          }].map(({ label, field, type, min, required = true }) => (
            <div key={field} className="mb-2 text-start col-12 col-md-6 mb-3 text-muted">
              <label htmlFor={field}>{label} :</label><br />
              {editMode || (required && isMissing(current[field])) ? (
                <input
                  className={`form-control form-control-sm ${required && isMissing(current[field]) ? 'is-invalid' : ''}`}
                  type={type}
                  value={current[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  id={field}
                  title={label}
                  aria-label={label}
                  min={min}
                />
              ) : (
                <div className="form-control form-control-sm bg-light border">
                  {getDisplayValue(field, current[field])}
                </div>
              )}
            </div>
          ))}
        </div>
        <hr />
        <div className="mb-2 text-start d-flex justify-content-between align-items-center">
          <strong>Conditions de prise :</strong>
        </div>

        {current.conditions.map((cond, i) => (
          <div key={i} className="mb-3 border rounded p-3 text-start bg-light">
            {[{
              label: 'Moment',
              field: 'time_of_day',
              type: 'select',
              options: [
                { value: '', label: 'Sélectionner...' },
                { value: 'morning', label: 'Matin' },
                { value: 'noon', label: 'Midi' },
                { value: 'evening', label: 'Soir' },
              ],
            }, {
              label: 'Intervalle (jours)',
              field: 'interval_days',
              type: 'number',
              min: '1',
            }, {
              label: 'Début',
              field: 'start_date',
              type: 'date',
            }, {
              label: 'Comprimés',
              field: 'tablet_count',
              type: 'number',
              step: '0.25',
              min: '0',
            }].map(({ label, field, type, step, min, options }) => {
              const missing = isConditionFieldMissing(field, cond);
              const wasFieldInitiallyMissing = wasInitiallyMissing(index, field, i);
              const disabled = field === 'start_date' && parseInt(cond.interval_days) === 1;

              return (
                <div key={field} className="mb-1">
                  <label htmlFor={field}>{label} :</label><br />
                  {wasFieldInitiallyMissing || editMode ? (
                    type === 'select' ? (
                      <select
                        className={`form-select form-select-sm ${missing ? 'is-invalid' : ''}`}
                        id={field}
                        value={cond[field]}
                        onChange={(e) => handleConditionChange(i, field, e.target.value)}
                        title={label}
                        aria-label={label}
                      >
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        className={`form-control form-control-sm ${missing ? 'is-invalid' : ''}`}
                        id={field}
                        value={cond[field]}
                        onChange={(e) => handleConditionChange(i, field, e.target.value)}
                        disabled={disabled}
                        step={step}
                        min={min}
                        title={label}
                        aria-label={label}
                      />
                    )
                  ) : (
                    <div className="form-control form-control-sm bg-white border">
                      <strong>{getDisplayValue(field, cond[field], options)}</strong>
                    </div>
                  )}
                </div>
              );
            })}
            {editMode && (
              <button
                className="btn btn-danger btn-sm mt-2"
                onClick={() => {
                  const updated = [...medicines];
                  updated[index].conditions.splice(i, 1);
                  setMedicines(updated);
                }}
                title="Supprimer cette condition"
                aria-label="Supprimer cette condition"
              >
                <i className="bi bi-trash me-2"></i>
                Supprimer
              </button>
            )}
          </div>
          ))}

          {editMode && (
            <button
              type="button"
              className="btn btn-outline-dark w-100"
              onClick={addCondition}
            >
            <i className="bi bi-plus-lg me-2"></i>
            {t('boxes.condition.add')}
            </button>
          )}

        <hr />
        <div className="d-flex justify-content-between gap-3">
          <button 
            className="btn btn-secondary" 
            onClick={goPrev} 
            disabled={index === 0}
            title="Précédent"
            aria-label="Précédent"
          >
            <i className="bi bi-chevron-left me-2"></i>
            Précédent
          </button>
          <div className="d-flex align-items-center">
            <span className="text-muted">{index + 1} / {medicines.length}</span>
          </div>
          <button
            className={`btn ${index < medicines.length - 1 ? "btn-primary" : "btn-success"}`}
            onClick={goNext}
            disabled={!isCurrentValid()}
            title={index < medicines.length - 1 ? "Suivant" : "Terminer"}
            aria-label="Suivant"
          >
            {index < medicines.length - 1 ? <i className="bi bi-chevron-right me-2"></i> : <i className="bi bi-check2-circle me-2"></i>}
            {index < medicines.length - 1 ? "Suivant ›" : "Terminer"}
          </button>
        </div>
      </div>
    </div>
  );
}
