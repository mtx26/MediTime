import { fetchSuggestions } from '@/utils/api/fetchSuggestions';
import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import { applyConditionFieldSideEffects } from '@meditime/utils';
import {
  DEFAULT_CONDITION,
  MEDICINE_REVIEW_CONDITION_FIELDS,
  MEDICINE_REVIEW_MAIN_FIELDS,
} from '@meditime/constants';
import type {
  MedicineReviewConditionInput,
  MedicineReviewLocationState,
  MedicineReviewMedicineInput,
  MedicineReviewPersonalCalendars,
  MedicineReviewProps,
  MedicineReviewSuggestion,
} from '@meditime/types';

const isMedicineSuggestion = (value: unknown): value is MedicineReviewSuggestion => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && typeof item.dose === 'string' && 'conditionnement' in item;
};

export function useMedicineReview({ personalCalendars }: MedicineReviewProps) {
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
    (updated[index] as unknown as Record<string, string | number | null>)[field] = value ?? '';
    setMedicines(updated);
  };

  const handleConditionChange = (i: number, field: string, value: string | number | null) => {
    if (!current || !MEDICINE_REVIEW_CONDITION_FIELDS.includes(field as (typeof MEDICINE_REVIEW_CONDITION_FIELDS)[number])) {
      return;
    }
    const updated = [...medicines];
    const currentCondition = (updated[index].conditions[i] ?? {}) as MedicineReviewConditionInput;
    updated[index].conditions[i] = applyConditionFieldSideEffects(currentCondition, field as keyof MedicineReviewConditionInput, value);
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
        if (updated.length === 0) {
          navigate(-1);
        } else if (index >= updated.length) {
          setIndex(updated.length - 1);
        }
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
      const results = await fetchSuggestions(current.name, typeof current.dose === 'number' ? current.dose : null);
      setSuggestions((results || []).filter(isMedicineSuggestion));
    }, 300);
    return () => clearTimeout(timeout);
  }, [current?.dose, current?.name]);

  return {
    t, lng, current, medicines, index, suggestions, showDropdown, setShowDropdown,
    handleChange, handleConditionChange, addCondition, deleteCondition,
    deleteMedicine, goPrev, goNext, handleSave, handleSubmit, setSuggestions,
  };
}
