import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toInt } from '@meditime/utils';
import type { MedicineReviewConditionInput, MedicineReviewConditionProps } from '@meditime/types';

interface ConditionFieldConfig {
  label: string;
  field: string;
  type: string;
  step?: string;
  min?: string;
  options?: { value: string; label: string }[];
  required: boolean | number;
  show?: boolean | number;
}

/** Helper to read a dynamic field from a condition object. */
function getField(cond: MedicineReviewConditionInput, field: string): string | number | null | undefined {
  return (cond as Record<string, string | number | null | undefined>)[field];
}

export default function MedicineReviewCondition({
  condition: cond,
  conditionIndex: i,
  onChange,
  onDelete,
}: MedicineReviewConditionProps) {
  const { t } = useTranslation();
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  const fields = [{
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
  }] satisfies ConditionFieldConfig[];

  return (
    <div className="mb-3 border rounded p-3 text-start bg-muted/30">
      {fields.filter(item => item.show !== false).map(({ label, field, type, step, min, options, required }) => (
        <div key={field} className="mb-2">
          <Label htmlFor={field}>{label} :</Label>
          {type === 'select' ? (
            <Select
              value={String(getField(cond, field) ?? '')}
              onValueChange={(val) => onChange(i, field, (field === 'max_date_mode' && val === 'none') ? '' : val)}
            >
              <SelectTrigger id={field} size="sm" className="w-full mt-1">
                <SelectValue placeholder={field === 'time_of_day' ? t('medicine_review.select_option') : (options?.[0]?.label || '')} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((opt) => (
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
                onClick={() => setOpenDropdownKey(`${i}:${field}:${getField(cond, field) || ''}:${Date.now()}`)}
                aria-label={label}
              >
                {(Object.hasOwn(cond, field) && typeof getField(cond, field) === 'string'
                  ? (field !== 'max_date'
                    ? String(getField(cond, field))
                    : String(getField(cond, field)).split('T')[0])
                  : t('medicine_review.select_option'))}
              </Button>
              <div className="relative">
                {openDropdownKey?.startsWith(`${i}:${field}`) && (
                  <div className="absolute z-20 mt-2 border rounded-md bg-popover p-2 shadow">
                    <Calendar
                      mode="single"
                      selected={typeof getField(cond, field) === 'string' ? new Date(String(getField(cond, field))) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        if (field === 'max_date') {
                          const d = new Date(date);
                          d.setHours(23, 59, 59, 999);
                          onChange(i, field, d.toISOString());
                        } else {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          onChange(i, field, `${yyyy}-${mm}-${dd}`);
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
                Object.hasOwn(cond, field) && field === 'max_date' && typeof getField(cond, field) === 'string'
                  ? String(getField(cond, field)).split('T')[0]
                  : String(Object.hasOwn(cond, field) ? getField(cond, field) ?? '' : '')
              }
              onChange={(e) => onChange(i, field, e.target.value)}
              step={step}
              min={min}
              title={label}
              aria-label={label}
              required={!!required}
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
        onClick={() => onDelete(i)}
        title={t('boxes.condition.delete')}
        aria-label={t('boxes.condition.delete')}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {t('boxes.condition.delete')}
      </Button>
    </div>
  );
}
