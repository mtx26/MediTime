import { useState } from 'react';
import type { FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  BoxesViewBoxItem,
  ConditionFieldKey,
  ConditionValue,
  EditingBoxState,
  EditableCondition,
} from '@meditime/types';
import type { CalendarSourceGroup } from '@meditime/utils';

interface UseBoxEditingParams {
  calendarSource: CalendarSourceGroup;
  calendarId: string | undefined;
}

export function useBoxEditing({ calendarSource, calendarId }: UseBoxEditingParams) {
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [editingBox, setEditingBox] = useState<EditingBoxState | null>(null);

  const initEditing = (box: BoxesViewBoxItem) => {
    setEditingBoxId(box.id);
    setEditingBox({
      name: box.name,
      dose: box.dose ?? null,
      box_capacity: box.box_capacity,
      stock_alert_threshold: box.stock_alert_threshold,
      stock_quantity: box.stock_quantity,
      code_fmd: box.code_fmd || null,
      conditions: (box.conditions || []).reduce<Record<string, EditableCondition>>(
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

  const addCondition = () => {
    const id = uuidv4();
    setEditingBox((p) => p ? ({
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
    }) : p);
  };

  const deleteCondition = (id: string) => {
    setEditingBox((p) => p ? ({
      ...p,
      conditions: { ...p.conditions, [id]: undefined },
    }) : p);
  };

  const updateCondition = (id: string, field: ConditionFieldKey, val: ConditionValue) => {
    setEditingBox((p) => p ? ({
      ...p,
      conditions: {
        ...p.conditions,
        [id]: { ...p.conditions[id]!, [field]: val },
      },
    }) : p);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBox) return;
    const conditions = Object.values(editingBox.conditions || {}).filter(
      (c): c is EditableCondition => c !== undefined
    );
    
    if (String(editingBoxId || '').startsWith('temp-')) {
      await calendarSource.createBox!(
        calendarId!,
        editingBox.name,
        editingBox.box_capacity ?? 0,
        editingBox.stock_alert_threshold ?? 0,
        editingBox.stock_quantity ?? 0,
        editingBox.dose,
        conditions,
        editingBox.code_fmd
      );
    } else {
      await calendarSource.updateBox!(
        calendarId!, 
        editingBoxId!, 
        {
          name: editingBox.name,
          dose: editingBox.dose ?? undefined,
          box_capacity: editingBox.box_capacity ?? undefined,
          stock_alert_threshold: editingBox.stock_alert_threshold ?? undefined,
          stock_quantity: editingBox.stock_quantity ?? undefined,
          code_fmd: editingBox.code_fmd,
          conditions,
        }
      );
    }
    
    resetEditing();
  };

  const createTemporaryBox = (medicineData: Partial<BoxesViewBoxItem> = {}) => {
    const newBox = {
      id: `temp-${Date.now()}`,
      name: medicineData.name || '',
      dose: medicineData.dose || 0,
      box_capacity: medicineData.box_capacity || 0,
      stock_quantity: medicineData.stock_quantity || 0,
      stock_alert_threshold: medicineData.stock_alert_threshold || 10,
      code_fmd: medicineData.code_fmd || null,
      conditions: medicineData.conditions || [],
    };
    initEditing(newBox);
  };

  return {
    editingBoxId,
    editingBox,
    setEditingBox,
    initEditing,
    cancelEditing: resetEditing,
    addCondition,
    deleteCondition,
    updateCondition,
    handleSubmit,
    createTemporaryBox,
  };
}
