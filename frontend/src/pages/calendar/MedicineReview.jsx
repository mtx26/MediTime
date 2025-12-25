import { fetchSuggestions } from '../../utils/api/fetchSuggestions';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowControls from '../../components/calendar/ArrowControls';
import { useAlert } from '../../contexts/AlertContext';

const DEFAULT_CONDITION = {
  time_of_day: '',
  interval_days: '',
  start_date: '',
  tablet_count: '',
  max_date_mode: '',
  max_date: null,
  max_date_days: null,
};

export default function MedicineReview({ personalCalendars }) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const medicineBoxes = location.state?.importedMedicines ?? [];
  const calendarName = location.state?.calendarName;
  const lng = params.lng;
  const { showAlert, showConfirm } = useAlert();

  const [medicines, setMedicines] = useState(medicineBoxes);

  const [index, setIndex] = useState(0);
  const current = medicines[index];
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const CONDITION_FIELDS = ['time_of_day', 'interval_days', 'tablet_count', 'start_date', 'max_date_mode', 'max_date', 'max_date_days'];
  const MAIN_FIELDS = ['name', 'dose', 'stock_quantity', 'stock_max', 'stock_alert_threshold'];

  const handleChange = (field, value) => {
    if (!MAIN_FIELDS.includes(field)) return;
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleConditionChange = (i, field, value) => {
    if (!CONDITION_FIELDS.includes(field)) return;
    const updated = [...medicines];
    
    // Gestion spéciale pour interval_days
    if (field === 'interval_days' && parseInt(value) <= 1) {
      updated[index].conditions[i]['start_date'] = null;
    }
    
    // Gestion spéciale pour max_date_mode
    if (field === 'max_date_mode') {
      updated[index].conditions[i]['max_date'] = null;
      updated[index].conditions[i]['max_date_days'] = null;
    }
    
    // Gestion spéciale pour max_date et max_date_days
    if (field === 'max_date_days' && value) {
      const cond = updated[index].conditions[i];
      const now = new Date();
      const target = new Date(now);
      const hourByTime = { morning: 8, noon: 12, evening: 18 };
      const targetHour = hourByTime[cond.time_of_day] ?? 8;
      target.setHours(targetHour, 0, 0, 0);
      const includeToday = now < target;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (includeToday ? parseInt(value) - 1 : parseInt(value)));
      endDate.setHours(23, 59, 59, 999);
      updated[index].conditions[i]['max_date'] = endDate.toISOString();
      updated[index].conditions[i]['max_date_days'] = parseInt(value);
    } else if (field === 'max_date' && value) {
      const selectedDate = new Date(value);
      selectedDate.setHours(23, 59, 59, 999);
      updated[index].conditions[i]['max_date'] = selectedDate.toISOString();
    }
    
    updated[index].conditions[i][field] = value;
    setMedicines(updated);
  };

  const addCondition = () => {
    const updated = [...medicines];
    updated[index].conditions.push({ ...DEFAULT_CONDITION });
    setMedicines(updated);
  };

  const deleteCondition = (condIndex) => {
    const updated = [...medicines];
    updated[index].conditions.splice(condIndex, 1);
    setMedicines(updated);
  };

  const deleteMedicine = () => {
    showConfirm(
      'confirm-danger',
      t('medicine_review.confirm_delete_title'),
      t('medicine_review.confirm_delete_message', { name: current.name }),
      () => {
        const updated = [...medicines];
        updated.splice(index, 1);
        setMedicines(updated);
        
        // Ajuster l'index après suppression
        if (updated.length === 0) {
          // S'il n'y a plus de médicaments, retourner à la page précédente
          navigate(-1);
        } else if (index >= updated.length) {
          // Si on était sur le dernier, aller au précédent
          setIndex(updated.length - 1);
        }
        // Sinon, rester sur le même index (qui affichera le médicament suivant)
        showAlert('success', t('medicine_review.delete_success'));
      }
    );
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const goNext = () => {
    if (index < medicines.length - 1) setIndex(index + 1);
  };

  const handleSave = async () => {
    showConfirm(
      'confirm',
      t('medicine_review.confirm_save_title'),
      t('medicine_review.confirm_save_message'),
      async () => {
        const rep = await personalCalendars.saveAnalysisResult(calendarName, medicines);
        if (rep.success) {
          navigate(`/${lng}/calendar/${rep.calendar_id}`);
        }
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (index < medicines.length - 1) {
      goNext();
    } else {
      handleSave();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  useEffect(() => {
    if (!current.name || current.name.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await fetchSuggestions(current.name, current.dose || '');
      setSuggestions(results || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [current.name, current.dose]);

  return (
    <div className="text-center">
      <form onSubmit={handleSubmit} className="card mx-auto shadow p-4 mb-4" style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <h5 className="text-center fw-bold mb-0">
            <i className="bi bi-pencil me-2"></i>
            {t('medicine_review.title')}
          </h5>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={deleteMedicine}
            title={t('medicine_review.delete_medicine')}
            aria-label={t('medicine_review.delete_medicine')}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
        
        <div className="position-relative mb-3">
          <div className="row">
          <div className="col-12 col-md-6 mb-3 text-start">
            <label htmlFor="name">{t('boxes.name')} :</label><br />
            <input
              type="text"
              className={`form-control form-control-sm ${current.name.trim() === '' ? '' : 'border-success border-2'} `}
              value={current.name}
              onChange={(e) => {
                handleChange('name', e.target.value);
                setShowDropdown(true);
              }}
              onClick={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={t('boxes.start_typing')}
              required
              title={t('boxes.name')}
              aria-label={t('boxes.name')}
            />
          </div>

          <div className="col-12 col-md-6 mb-3 text-start">
            <label htmlFor="dose">{t('boxes.dose')} :</label><br />
            <input
              className={`form-control form-control-sm ${current.dose && current.dose.toString().trim() !== '' ? 'border-success border-2' : ''}`}
              type="number"
              value={current.dose || ''}
              onChange={(e) => {
                handleChange('dose', e.target.value);
                if (current.name && current.name.length >= 2) {
                  setShowDropdown(true);
                }
              }}
              onFocus={() => {
                // Afficher les suggestions si le nom est rempli et qu'il y en a
                if (current.name && current.name.length >= 2 && suggestions.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              id="dose"
              placeholder={t('mg')}
              title={t('boxes.dose')}
              aria-label={t('boxes.dose')}
              min={0}
              required
            />
          </div>

          </div>

          {/* Dropdown des suggestions juste en dessous */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="dropdown-menu show w-100 position-absolute z-3" style={{ maxHeight: 200, overflowY: 'auto', top: '100%', left: 0, right: 0 }}>
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

        <div className="row mb-3">
          {[{
            label: t('medicine_review.current_stock'),
            field: 'stock_quantity',
            type: 'number',
            required: false,
          }, {
            label: t('medicine_review.maximum_stock'),
            field: 'stock_max',
            type: 'number',
            min: '0',
            required: false,
          }, {
            label: t('boxes.alert_threshold'),
            field: 'stock_alert_threshold',
            type: 'number',
            min: '0',
            required: false,
          }].map(({ label, field, type, min }) => (
            <div key={field} className="mb-2 text-start col-12 col-md-6 mb-3 text-muted">
              <label htmlFor={field}>{label} :</label><br />
              <input
                className="form-control form-control-sm"
                type={type}
                value={current[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                id={field}
                title={label}
                aria-label={label}
                min={min}
              />
            </div>
          ))}
        </div>
        <hr />
        <div className="mb-2 text-start d-flex justify-content-between align-items-center">
          <strong>{t('boxes.intake_conditions')} :</strong>
        </div>

        {current.conditions.map((cond, i) => (
          <div key={i} className="mb-3 border rounded p-3 text-start bg-light">
            {[{
              label: t('boxes.condition.tablet_count'),
              field: 'tablet_count',
              type: 'number',
              step: '0.25',
              min: '0',
              required: true,
            }, {
              label: t('boxes.condition.time_of_day'),
              field: 'time_of_day',
              type: 'select',
              options: [
                { value: '', label: t('medicine_review.select_option') },
                { value: 'morning', label: t('morning') },
                { value: 'noon', label: t('noon') },
                { value: 'evening', label: t('evening') },
              ],
              required: true,
            }, {
              label: t('boxes.condition.interval_days'),
              field: 'interval_days',
              type: 'number',
              min: '1',
              required: true,
            }, {
              label: t('boxes.condition.start_date'),
              field: 'start_date',
              type: 'date',
              show: parseInt(cond.interval_days) > 1,
              required: parseInt(cond.interval_days) > 1,
            }, {
              label: t('boxes.condition.max_date_mode'),
              field: 'max_date_mode',
              type: 'select',
              options: [
                { value: '', label: t('boxes.condition.no_limit') },
                { value: 'until_date', label: t('boxes.condition.until_date') },
                { value: 'for_days', label: t('boxes.condition.for_days') },
              ],
              required: false,
            }, {
              label: cond.max_date_mode === 'until_date' 
                ? t('boxes.condition.end_date') 
                : t('boxes.condition.duration_days'),
              field: cond.max_date_mode === 'until_date' ? 'max_date' : 'max_date_days',
              type: cond.max_date_mode === 'until_date' ? 'date' : 'number',
              min: '1',
              step: '1',
              show: cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
              required: cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
            }].filter(item => item.show !== false).map(({ label, field, type, step, min, options, required }) => (
              <div key={field} className="mb-1">
                <label htmlFor={field}>{label} :</label><br />
                {type === 'select' ? (
                  <select
                    className="form-select form-select-sm"
                    id={field}
                    value={cond[field] || ''}
                    onChange={(e) => handleConditionChange(i, field, e.target.value)}
                    title={label}
                    aria-label={label}
                    required={required}
                  >
                    {options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    className="form-control form-control-sm"
                    id={field}
                    value={field === 'max_date' && cond[field] ? cond[field].split('T')[0] : (cond[field] || '')}
                    onChange={(e) => handleConditionChange(i, field, e.target.value)}
                    step={step}
                    min={min}
                    title={label}
                    aria-label={label}
                    required={required}
                  />
                )}
              </div>
            ))}
            <button
              className="btn btn-danger btn-sm mt-2"
              onClick={() => deleteCondition(i)}
              title={t('boxes.condition.delete')}
              aria-label={t('boxes.condition.delete')}
            >
              <i className="bi bi-trash me-2"></i>
              {t('boxes.condition.delete')}
            </button>
          </div>
          ))}

        <button
          type="button"
          className="btn btn-sm bg-light border w-100 mt-2"
          onClick={addCondition}
          title={t('boxes.condition.add')}
          aria-label={t('boxes.condition.add')}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {t('boxes.condition.add')}
        </button>

        <hr />
        <ArrowControls
          onLeft={goPrev}
          onRight={index < medicines.length - 1 ? goNext : handleSave}
        />
        <div className="d-flex justify-content-between gap-3">
          <button
            type="button"
            className="btn btn-secondary" 
            onClick={goPrev} 
            disabled={index === 0}
            title={t('previous')}
            aria-label={t('previous')}
          >
            <i className="bi bi-chevron-left me-2"></i>
            {t('previous')}
          </button>
          <div className="d-flex align-items-center">
            <span className="text-muted">{index + 1} / {medicines.length}</span>
          </div>
          <button
            type="submit"
            className={`btn ${index < medicines.length - 1 ? "btn-primary" : "btn-success"}`}
            title={index < medicines.length - 1 ? t('next') : t('medicine_review.finish')}
            aria-label={t('next')}
          >
            {index < medicines.length - 1 ? <i className="bi bi-chevron-right me-2"></i> : <i className="bi bi-check2-circle me-2"></i>}
            {index < medicines.length - 1 ? t('next') : t('medicine_review.finish')}
          </button>
        </div>
      </form>
    </div>
  );
}
