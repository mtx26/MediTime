import { useTranslation } from 'react-i18next';
import { usePillboxUses } from '@/hooks/pillbox/usePillboxUses';
import PillboxUsesTable from '@/components/pillbox/PillboxUsesTable';
import NotFound from '@/pages/general/NotFound';
import { History } from 'lucide-react';
import type { PillboxUsesPageProps } from '@meditime/types';

function PillboxUses(props: PillboxUsesPageProps) {
  const { t } = useTranslation();
  const { loading, notFound, calendarId, sortedUses, cancelUse, formatWeek } = usePillboxUses(props);

  if (loading === true && calendarId) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="max-w-175 mx-auto">
      <h4 className="mb-3 font-bold flex items-center gap-2">
        <History className="h-5 w-5" />
        {t('pillbox_uses')}
      </h4>
      {sortedUses.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg text-muted-foreground mb-4">
            {t('you_have_no_pillbox_use_history')}
          </p>
        </div>
      ) : (
        <PillboxUsesTable uses={sortedUses} formatWeek={formatWeek} onCancel={cancelUse} />
      )}
    </div>
  );
}

export default PillboxUses;