import { useTranslation } from 'react-i18next';
import { useStockAlerts } from '@/hooks/medicines/useStockAlerts';
import ActionSheet from '@/components/common/ActionSheet';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import MedicineCard from '@/components/medicines/MedicineCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import type { StockAlertsPageProps } from '@meditime/types';

function StockAlertsPage(props: StockAlertsPageProps) {
  const { t } = useTranslation();
  const {
    loadingBoxes,
    notFound,
    alerts,
    restockBox,
    navigateToMissingPillbox,
    actionSheetActions,
  } = useStockAlerts(props);

  if (loadingBoxes === undefined) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="container mx-auto flex flex-col items-center gap-4">
      <div className="w-full max-w-3xl">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />        
          <h4 className="text-xl font-bold">
            {t('stock_alerts')}
          </h4>
        </div>
        <ActionSheet
          dataTour="stock-alerts-actions-btn"
          actions={toActionSheetItems(actionSheetActions, t)}
        />
      </div>

      {alerts.length === 0 ? (
        <Alert className="max-w-150">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{t('no_low_stock')}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {alerts.map((med) => (
            <MedicineCard
              key={med.id}
              box={med}
              onRestock={restockBox}
              onMissingPillbox={navigateToMissingPillbox}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default StockAlertsPage;
