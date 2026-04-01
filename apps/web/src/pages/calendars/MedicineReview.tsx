import { fetchSuggestions } from '@/utils/api/fetchSuggestions';
import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowControls from '@/components/calendar/ArrowControls';
import { useAlert } from '@/contexts/AlertContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  DEFAULT_CONDITION,
  MEDICINE_REVIEW_CONDITION_FIELDS,
  MEDICINE_REVIEW_MAIN_FIELDS,
  MEDICINE_REVIEW_TIME_OF_DAY_HOURS,
} from '@meditime/constants';
import type {
  MedicineReviewConditionInput,
  MedicineReviewLocationState,
  MedicineReviewMedicineInput,
  MedicineReviewPersonalCalendars,
  MedicineReviewProps,
  MedicineReviewSuggestion,
} from '@meditime/types';

const toInt = (value: string | number): number => Number.parseInt(String(value), 10);

const isMedicineSuggestion = (value: unknown): value is MedicineReviewSuggestion => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && typeof item.dose === 'string' && 'conditionnement' in item;
};

export default function MedicineReview({ personalCalendars }: MedicineReviewProps) {
  const location = useLocation();
  const params = useParams<{ lng: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const state = (location.state ?? {}) as MedicineReviewLocationState;
  const medicineBoxes = Array.isArray(state.importedMedicines) ? state.importedMedicines : [];
  const calendarName = state.calendarName ?? '';
  const lng = params.lng;
  const { showAlert, showConfirm } = useAlert();
  const calendarsApi = personalCalendars as MedicineReviewPersonalCalendars;

  const [medicines, setMedicines] = useState<MedicineReviewMedicineInput[]>(medicineBoxes);

  const [index, setIndex] = useState(0);
  const current = medicines[index] ?? null;
  const [suggestions, setSuggestions] = useState<MedicineReviewSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  useEffect(() => {
    if (!calendarName || medicines.length === 0) {
      navigate(`/${lng ?? 'en'}/add-calendar`, { replace: true });
    }
  }, [calendarName, lng, medicines.length, navigate]);

  const handleChange = (field: string, value: string | number | null) => {
    if (!current || !MEDICINE_REVIEW_MAIN_FIELDS.includes(field as (typeof MEDICINE_REVIEW_MAIN_FIELDS)[number])) {
      return;
    }
    const updated = [...medicines];
    (updated[index] as Record<string, unknown>)[field] = value ?? '';
    setMedicines(updated);
  };

  const handleConditionChange = (i: number, field: string, value: string | number | null) => {
    if (!current || !MEDICINE_REVIEW_CONDITION_FIELDS.includes(field as (typeof MEDICINE_REVIEW_CONDITION_FIELDS)[number])) {
      return;
    }
    const updated = [...medicines];
    const currentCondition = (updated[index].conditions[i] ?? {}) as MedicineReviewConditionInput;
    updated[index].conditions[i] = currentCondition;
    
    // Gestion spéciale pour interval_days
    if (field === 'interval_days' && toInt(value ?? 0) <= 1) {
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
      const targetHour = MEDICINE_REVIEW_TIME_OF_DAY_HOURS[String(cond.time_of_day) as keyof typeof MEDICINE_REVIEW_TIME_OF_DAY_HOURS] ?? 8;
      target.setHours(targetHour, 0, 0, 0);
      const includeToday = now < target;
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (includeToday ? toInt(value) - 1 : toInt(value)));
      endDate.setHours(23, 59, 59, 999);
      updated[index].conditions[i]['max_date'] = endDate.toISOString();
      updated[index].conditions[i]['max_date_days'] = toInt(value);
    } else if (field === 'max_date' && value) {
      const selectedDate = new Date(String(value));
      selectedDate.setHours(23, 59, 59, 999);
      updated[index].conditions[i]['max_date'] = selectedDate.toISOString();
    }
    
    (updated[index].conditions[i] as Record<string, unknown>)[field] = value ?? '';
    setMedicines(updated);
  };

  const addCondition = () => {
    if (!current) return;
    const updated = [...medicines];
    updated[index].conditions.push({ ...DEFAULT_CONDITION });
    setMedicines(updated);
  };

  const deleteCondition = (condIndex: number) => {
    if (!current) return;
    const updated = [...medicines];
    updated[index].conditions.splice(condIndex, 1);
    setMedicines(updated);
  };

  const deleteMedicine = () => {
    showConfirm(
      'confirm-danger',
      t('medicine_review.confirm_delete_title'),
      t('medicine_review.confirm_delete_message', { name: current?.name || '' }),
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
      'confirm-safe',
      t('medicine_review.confirm_save_title'),
      t('medicine_review.confirm_save_message'),
      async () => {
        const rep = await calendarsApi.saveAnalysisResult(calendarName, medicines);
        if (rep.success && rep.calendar_id) {
          navigate(`/${lng}/calendar/${rep.calendar_id}`);
        }
      }
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    if (!current) return;
    const updated = [...medicines];
    const med = updated[index];

    // Si les champs n'existent pas, on les initialise
    if (med.stock_quantity === undefined) med.stock_quantity = '';
    if (med.stock_max === undefined) med.stock_max = '';
    if (med.stock_alert_threshold === undefined) med.stock_alert_threshold = '';
    if (!Array.isArray(med.conditions)) med.conditions = [];

    setMedicines(updated);
  }, [current, index, medicines]);

  useEffect(() => {
    if (!current?.name || current.name.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await fetchSuggestions(current.name, current.dose || '');
      setSuggestions((results || []).filter(isMedicineSuggestion));
    }, 300);

    return () => clearTimeout(timeout);
  }, [current?.dose, current?.name]);

  if (!current) {
    return null;
  }

  return (
    <div className="text-center">
      <form onSubmit={handleSubmit} className="max-w-125 mx-auto mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {t('medicine_review.title')}
            </CardTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={deleteMedicine}
              title={t('medicine_review.delete_medicine')}
              aria-label={t('medicine_review.delete_medicine')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('boxes.condition.delete')}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-start">
              <div className="relative">
                <Label htmlFor="name">{t('boxes.name')} :</Label>
                <Input
                  id="name"
                  type="text"
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
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full max-h-52 overflow-y-auto border rounded-md bg-popover text-popover-foreground shadow top-full left-0">
                    {suggestions.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent"
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
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="dose">{t('boxes.dose')} :</Label>
                <Input
                  id="dose"
                  type="number"
                  value={current.dose || ''}
                  onChange={(e) => {
                    handleChange('dose', e.target.value);
                    if (current.name && current.name.length >= 2) {
                      setShowDropdown(true);
                    }
                  }}
                  onFocus={() => {
                    if (current.name && current.name.length >= 2 && suggestions.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder={t('mg')}
                  title={t('boxes.dose')}
                  aria-label={t('boxes.dose')}
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-start">
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
              }].map(({ label, field, type, min }: { label: string; field: string; type: string; min?: string }) => (
                <div key={field} className="text-start">
                  <Label htmlFor={field}>{label} :</Label>
                  <Input
                    id={field}
                    type={type}
                    value={String((current as Record<string, unknown>)[field] ?? '')}
                    onChange={(e) => handleChange(field, e.target.value)}
                    title={label}
                    aria-label={label}
                    min={min}
                  />
                </div>
              ))}
            </div>

            <div className="border-t" />
            <div className="mb-2 text-start flex items-center justify-between">
              <strong>{t('boxes.intake_conditions')} :</strong>
            </div>

            {current.conditions.map((cond: MedicineReviewConditionInput, i: number) => (
              <div key={i} className="mb-3 border rounded p-3 text-start bg-muted/30">
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
                  show: toInt(cond.interval_days ?? 0) > 1,
                  required: toInt(cond.interval_days ?? 0) > 1,
                }, {
                  label: t('boxes.condition.max_date_mode'),
                  field: 'max_date_mode',
                  type: 'select',
                  options: [
                    { value: 'none', label: t('boxes.condition.no_limit') },
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
                }].filter(item => item.show !== false).map(({ label, field, type, step, min, options, required }: any) => (
                  <div key={field} className="mb-2">
                    <Label htmlFor={field}>{label} :</Label>
                    {type === 'select' ? (
                      <Select
                        value={String((cond as Record<string, unknown>)[field] ?? '')}
                        onValueChange={(val) => handleConditionChange(i, field, (field === 'max_date_mode' && val === 'none') ? '' : val)}
                      >
                        <SelectTrigger id={field} size="sm" className="w-full mt-1">
                          <SelectValue placeholder={field === 'time_of_day' ? t('medicine_review.select_option') : (options?.[0]?.label || '')} />
                        </SelectTrigger>
                        <SelectContent>
                          {options?.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : type === 'date' ? (
                      <div className="mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setOpenDropdownKey(`${i}:${field}:${cond[field] || ''}:${Date.now()}`)}
                          aria-label={label}
                        >
                          {(typeof (cond as Record<string, unknown>)[field] === 'string'
                            ? (field !== 'max_date'
                              ? String((cond as Record<string, unknown>)[field])
                              : String((cond as Record<string, unknown>)[field]).split('T')[0])
                            : t('medicine_review.select_option'))}
                        </Button>
                        {/* Inline popover calendar */}
                        <div className="relative">
                          {/* Simple toggle: render when last opened matches this field */}
                          {openDropdownKey?.startsWith(`${i}:${field}`) && (
                            <div className="absolute z-20 mt-2 border rounded-md bg-popover p-2 shadow">
                              <Calendar
                                mode="single"
                                selected={typeof (cond as Record<string, unknown>)[field] === 'string' ? new Date(String((cond as Record<string, unknown>)[field])) : undefined}
                                onSelect={(date) => {
                                  if (!date) return;
                                  if (field === 'max_date') {
                                    const d = new Date(date);
                                    d.setHours(23, 59, 59, 999);
                                    handleConditionChange(i, field, d.toISOString());
                                  } else {
                                    const yyyy = date.getFullYear();
                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                    const dd = String(date.getDate()).padStart(2, '0');
                                    handleConditionChange(i, field, `${yyyy}-${mm}-${dd}`);
                                  }
                                  setOpenDropdownKey(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Input
                        id={field}
                        type={type}
                        value={
                          field === 'max_date' && typeof (cond as Record<string, unknown>)[field] === 'string'
                            ? String((cond as Record<string, unknown>)[field]).split('T')[0]
                            : String((cond as Record<string, unknown>)[field] ?? '')
                        }
                        onChange={(e) => handleConditionChange(i, field, e.target.value)}
                        step={step}
                        min={min}
                        title={label}
                        aria-label={label}
                        required={required}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => deleteCondition(i)}
                  title={t('boxes.condition.delete')}
                  aria-label={t('boxes.condition.delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('boxes.condition.delete')}
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full mt-2"
              onClick={addCondition}
              title={t('boxes.condition.add')}
              aria-label={t('boxes.condition.add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('boxes.condition.add')}
            </Button>

            <div className="border-t" />
            <ArrowControls
              onLeft={goPrev}
              onRight={index < medicines.length - 1 ? goNext : handleSave}
            />
            <div className="flex justify-between items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={goPrev}
                disabled={index === 0}
                title={t('previous')}
                aria-label={t('previous')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('previous')}
              </Button>
              <div className="flex items-center">
                <span className="text-muted-foreground">{index + 1} / {medicines.length}</span>
              </div>
              <Button
                type="submit"
                title={index < medicines.length - 1 ? t('next') : t('medicine_review.finish')}
                aria-label={t('next')}
                className={index < medicines.length - 1 ? '' : 'bg-green-600 hover:bg-green-700'}
              >
                {index < medicines.length - 1 ? (
                  <ChevronRight className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {index < medicines.length - 1 ? t('next') : t('medicine_review.finish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
