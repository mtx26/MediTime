import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { useMissedIntakes } from '@/hooks/medicines/useMissedIntakes';
import MissedModeSelector from '@/components/medicines/MissedModeSelector';
import MissedIntakeMode from '@/components/medicines/MissedIntakeMode';
import MissedMedicationMode from '@/components/medicines/MissedMedicationMode';
import NotFound from '@/pages/general/NotFound';
import type { MissedIntakesPageProps } from '@meditime/types';

function MissedIntakesPage(props: MissedIntakesPageProps) {
  const { t } = useTranslation();
  const { mode, setMode, loadingBoxes, notFound, activeBoxes } = useMissedIntakes(props);

  if (loadingBoxes === undefined) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="container mx-auto flex flex-col items-center gap-3">
      <div className="w-full max-w-2xl">
        <h4 className="text-xl font-bold mb-0.5">{t('missed_intakes.title')}</h4>
        <p className="text-sm text-muted-foreground mb-3">{t('missed_intakes.subtitle')}</p>

        <MissedModeSelector mode={mode} onModeChange={setMode} />
        <Separator className="mb-4" />

        {mode === 'intake' && <MissedIntakeMode />}
        {mode === 'medication' && <MissedMedicationMode activeBoxes={activeBoxes} />}
      </div>
    </div>
  );
}

export default MissedIntakesPage;
