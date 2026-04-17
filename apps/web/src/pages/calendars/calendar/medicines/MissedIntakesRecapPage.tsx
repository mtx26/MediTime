import { useTranslation } from 'react-i18next';
import { useMissedIntakesRecap } from '@/hooks/medicines/useMissedIntakesRecap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Info } from 'lucide-react';
import RecapCriteriaSummary from '@/components/medicines/RecapCriteriaSummary';
import RecapAffectedMedCard from '@/components/medicines/RecapAffectedMedCard';
import type { MissedIntakesPageProps } from '@meditime/types';

function MissedIntakesRecapPage(props: MissedIntakesPageProps) {
  const { t } = useTranslation();
  const {
    payload,
    loading,
    applying,
    previewBoxes,
    previewDays,
    handleApply,
  } = useMissedIntakesRecap(props);

  if (!payload) return null;

  return (
    <div className="container mx-auto flex flex-col items-center gap-3">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div>
          <h4 className="text-xl font-bold mb-0.5">{t('missed_intakes.recap_title')}</h4>
          <p className="text-sm text-muted-foreground">{t('missed_intakes.recap_subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <RecapCriteriaSummary payload={payload} previewDays={previewDays} />

            {previewBoxes.length > 0 ? (
              <div className="space-y-2">
                <h5 className="font-semibold">{t('missed_intakes.affected_meds')}</h5>
                <div className="space-y-1.5">
                  {previewBoxes.map((box) => (
                    <RecapAffectedMedCard key={box.box_id} box={box} />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="py-0">
                <CardContent className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {t('missed_intakes.no_affected_meds')}
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
              <Info className="size-4 mt-0.5 shrink-0" />
              <span>
                {payload.mode === 'intake'
                  ? t('missed_intakes.info_intake')
                  : t('missed_intakes.info_medication')}
              </span>
            </div>

            {/* Actions */}
            {previewBoxes.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button onClick={handleApply} disabled={applying}>
                  {applying && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {t('missed_intakes.apply')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MissedIntakesRecapPage;
