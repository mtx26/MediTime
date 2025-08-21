import { fetchSuggestions } from '../../utils/api/fetchSuggestions';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_CONDITION = {
  time_of_day: '',
  interval_days: '',
  start_date: '',
  tablet_count: '',
};

export default function MedicineReview() {
  const location = useLocation();
  const medicineBoxes = location.state?.importedMedicines ?? [];

  const [medicines, setMedicines] = useState(medicineBoxes);

  const [index, setIndex] = useState(0);
  const current = medicines[index];
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const isMissing = (v) => !v?.toString().trim();

  const isConditionFieldMissing = (field, cond) => {
    if (field === 'start_date') {
      return parseInt(cond.interval_days) > 1 && isMissing(cond.start_date);
    }
    return isMissing(cond[field]);
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
  };

  const goNext = () => {
    if (index < medicines.length - 1) setIndex(index + 1);
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
      const results = await fetchSuggestions(current.name, current.dose);
      setSuggestions(results || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [current.name, current.dose]);


  return (
    <div className="text-center">
      <div className="card mx-auto shadow p-4 mb-4" style={{ maxWidth: 500 }}>
        <div className="row mb-3">
          <div className="col-6 position-relative mb-3 text-start">
            <label htmlFor="name">Nom :</label><br />
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
            {showDropdown && suggestions.length > 0 && (
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
            </div>
          ))}
        </div>
        <hr />
        <div className="mb-2 text-start">
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
              const disabled = field === 'start_date' && parseInt(cond.interval_days) === 1;

              return (
                <div key={field} className="mb-1">
                  <label htmlFor={field}>{label} :</label><br />
                  {type === 'select' ? (
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
                  )}
                </div>
              );
            })}
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
          </div>
          ))}

        <button 
          className="btn btn-outline-primary w-100 mb-3" 
          onClick={addCondition}
          title="Ajouter une condition"
          aria-label="Ajouter une condition"
        >
          <i className="bi bi-plus-circle me-2"></i>
          Ajouter une condition
        </button>
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
            <span className="text-muted me-2">{index + 1} / {medicines.length}</span>
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
