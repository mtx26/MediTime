import { useMedicineReview } from '@/hooks/medicine/useMedicineReview';
import ArrowControls from '@/components/calendar/ArrowControls';
import MedicineReviewCondition from './components/MedicineReviewCondition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { MedicineReviewConditionInput, MedicineReviewProps } from '@meditime/types';

export default function MedicineReview({ personalCalendars }: MedicineReviewProps) {
  const {
    t, lng, current, medicines, index, suggestions, showDropdown, setShowDropdown,
    handleChange, handleConditionChange, addCondition, deleteCondition,
    deleteMedicine, goPrev, goNext, handleSave, handleSubmit, setSuggestions,
  } = useMedicineReview({ personalCalendars });

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
                    value={String((current as unknown as Record<string, string | number | null>)[field] ?? '')}
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
              <MedicineReviewCondition
                key={i}
                condition={cond}
                conditionIndex={i}
                onChange={handleConditionChange}
                onDelete={deleteCondition}
              />
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
