import type { EditableCondition, ConditionFieldKey, ConditionValue, ConditionFieldConfig } from '@meditime/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface ConditionEditorProps {
  conditions: Record<string, any>;
  conditionFields: ConditionFieldConfig[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: ConditionFieldKey, value: ConditionValue) => void;
  t: (key: string) => string;
}

const ConditionEditor = ({
  conditions,
  conditionFields,
  onAdd,
  onDelete,
  onUpdate,
  t,
}: ConditionEditorProps) => {
  return (
    <div className="space-y-3">
      <Label className="font-medium">{t('boxes.intake_conditions')}</Label>
      {Object.values(conditions || {})
        .filter(
          (c): c is EditableCondition =>
            !!c && typeof c === 'object' && typeof (c as { id?: unknown }).id === 'string'
        )
        .map((cond) => (
          <div
            key={cond.id}
            className="p-3 border rounded-md bg-muted/50 space-y-3"
          >
            {conditionFields.map(
              ({ label, field, type, min, step, format, options, ifComplete, onChange, required }, idx) => {
                if (ifComplete && !ifComplete(cond)) {
                  return null;
                }

                const resolvedLabel = typeof label === 'function' ? label(cond) : label;
                const resolvedField = typeof field === 'function' ? field(cond) : field;
                const resolvedType = typeof type === 'function' ? type(cond) : type;
                const resolvedFormat = typeof format === 'function' ? format(cond) : format;
                const resolvedRequired = typeof required === 'function' ? required(cond) : required;

                return (
                  <div key={`${cond.id}-${resolvedField}-${idx}`} className="space-y-1">
                    <Label className="text-sm">{resolvedLabel}</Label>
                    {resolvedType === 'select' ? (
                      <Select
                        value={String(cond[resolvedField] ?? 'none')}
                        onValueChange={(value) => {
                          onUpdate(cond.id, resolvedField, value);
                          if (onChange) {
                            onChange(cond, value, (f, v) => onUpdate(cond.id, f, v));
                          }
                        }}
                        required={resolvedRequired}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options?.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={resolvedType}
                        value={
                          (resolvedField === 'start_date' || (resolvedField === 'max_date' && resolvedType === 'date')) && cond[resolvedField]
                            ? new Date(cond[resolvedField]).toISOString().split('T')[0]
                            : cond[resolvedField] ?? ''
                        }
                        min={min}
                        step={step}
                        onChange={(e) => {
                          let value: ConditionValue = e.target.value;
                          if (resolvedFormat === 'int') {
                            value = value === '' ? '' : parseInt(String(value), 10);
                          } else if (resolvedFormat === 'float') {
                            value = value === '' ? '' : parseFloat(String(value));
                          }
                          onUpdate(cond.id, resolvedField, value);
                          if (onChange) {
                            onChange(cond, value, (f, v) => onUpdate(cond.id, f, v));
                          }
                        }}
                        aria-label={resolvedLabel}
                        required={resolvedRequired}
                      />
                    )}
                  </div>
                );
              }
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(cond.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('boxes.condition.delete')}
            </Button>
          </div>
        ))}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4 mr-1" />
        {t('boxes.condition.add')}
      </Button>
    </div>
  );
};

export default ConditionEditor;
