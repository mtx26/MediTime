import type { ConditionFieldConfig } from '@meditime/types';
import type { TFunction } from 'i18next';

export function getConditionFields(t: TFunction): ConditionFieldConfig[] {
  return [
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
      onChange: (_cond, value, updateFn) => {
        if (Number(value) <= 1) {
          updateFn('start_date', null);
        }
      },
      required: true,
    },
    {
      label: t('boxes.condition.start_date'),
      field: 'start_date',
      type: 'date',
      ifComplete: (cond) => Number(cond.interval_days) > 1,
      required: (cond) => Number(cond.interval_days) > 1,
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
      onChange: (_cond, _value, updateFn) => {
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
          const hourByTime = { morning: 8, noon: 12, evening: 18 } as const;
          const targetHour = cond.time_of_day ? hourByTime[cond.time_of_day] : 8;
          target.setHours(targetHour, 0, 0, 0);
          const includeToday = now < target;
          const endDate = new Date(now);
          const daysValue = Number(value);
          endDate.setDate(endDate.getDate() + (includeToday ? daysValue - 1 : daysValue));
          endDate.setHours(23, 59, 59, 999);
          updateFn('max_date', endDate.toISOString());
          updateFn('max_date_days', daysValue);
        } else {
          const selectedDate = new Date(String(value));
          selectedDate.setHours(23, 59, 59, 999);
          updateFn('max_date', selectedDate.toISOString());
        }
      },
      ifComplete: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
      required: (cond) => cond.max_date_mode === 'until_date' || cond.max_date_mode === 'for_days',
    },
  ];
}
