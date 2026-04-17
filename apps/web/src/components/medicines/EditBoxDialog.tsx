import type { FormEvent } from 'react';
import type { ConditionFieldKey, ConditionValue, ConditionFieldConfig, EditingBoxState } from '@meditime/types';
import { fetchSuggestions } from '@/utils/api/fetchSuggestions';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import SearchInput from '@/components/common/SearchInput';
import ConditionEditor from './ConditionEditor';

interface EditBoxDialogProps {
  editingBoxId: string | null;
  editingBox: EditingBoxState | null;
  conditionFields: ConditionFieldConfig[];
  setEditingBox: React.Dispatch<React.SetStateAction<EditingBoxState | null>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onAddCondition: () => void;
  onDeleteCondition: (id: string) => void;
  onUpdateCondition: (id: string, field: ConditionFieldKey, value: ConditionValue) => void;
}

const EditBoxDialog = ({
  editingBoxId,
  editingBox,
  conditionFields,
  setEditingBox,
  onSubmit,
  onCancel,
  onAddCondition,
  onDeleteCondition,
  onUpdateCondition,
}: EditBoxDialogProps) => {
  const { t } = useTranslation();
  const isNew = String(editingBoxId || '').startsWith('temp-');

  return (
    <Dialog open={editingBoxId !== null} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-lg grid-rows-[auto_minmax(0,1fr)]! max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('boxes.add_manual') : t('boxes.edit')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNew ? t('boxes.add_manual') : t('boxes.edit')}
          </DialogDescription>
        </DialogHeader>
        {editingBox && (
          <form onSubmit={onSubmit} className="flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 p-1 pr-4">
                {/* Name + Dose */}
                <SearchInput
                  name={editingBox.name}
                  dose={editingBox.dose}
                  onChangeName={(value) => setEditingBox((p) => p ? ({ ...p, name: value }) : p)}
                  onChangeDose={(value) => setEditingBox((p) => p ? ({ ...p, dose: value }) : p)}
                  onChangeBoxCapacity={(value) => setEditingBox((p) => p ? ({ ...p, box_capacity: value }) : p)}
                  onChangeStockQuantity={(value) => setEditingBox((p) => p ? ({ ...p, stock_quantity: value }) : p)}
                  onChangeCodeFmd={(value) => setEditingBox((p) => p ? ({ ...p, code_fmd: value }) : p)}
                  fetchSuggestions={fetchSuggestions}
                />

                {/* Capacity + Alert Threshold */}
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('boxes.capacity')}</Label>
                    <Input
                      type="number"
                      value={editingBox.box_capacity ?? ''}
                      onChange={(e) =>
                        setEditingBox((p) => p ? ({
                          ...p,
                          box_capacity: e.target.value === '' ? null : Number(e.target.value),
                        }) : p)
                      }
                      aria-label={t('boxes.capacity')}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('boxes.alert_threshold')}</Label>
                    <Input
                      type="number"
                      value={editingBox.stock_alert_threshold ?? ''}
                      onChange={(e) =>
                        setEditingBox((p) => p ? ({
                          ...p,
                          stock_alert_threshold: e.target.value === '' ? null : Number(e.target.value),
                        }) : p)
                      }
                      aria-label={t('boxes.alert_threshold')}
                    />
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">{t('boxes.remaining_qty')}</Label>
                  <Input
                    type="number"
                    value={editingBox.stock_quantity ?? ''}
                    onChange={(e) =>
                      setEditingBox((p) => p ? ({
                        ...p,
                        stock_quantity: e.target.value === '' ? null : Number(e.target.value),
                      }) : p)
                    }
                    aria-label={t('boxes.remaining_qty')}
                  />
                </div>

                {/* Conditions */}
                <ConditionEditor
                  conditions={editingBox.conditions || {}}
                  conditionFields={conditionFields}
                  onAdd={onAddCondition}
                  onDelete={onDeleteCondition}
                  onUpdate={onUpdateCondition}
                  t={t}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="gap-2 mt-4 shrink-0">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" />
                {t('boxes.save')}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                {t('boxes.cancel')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditBoxDialog;
