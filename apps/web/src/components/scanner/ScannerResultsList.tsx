import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import type { ScannerResultsListProps } from "@meditime/types";

export default function ScannerResultsList({
  gtins,
  medicines,
  loadingGtin,
  onRemoveMedicine,
}: ScannerResultsListProps) {
  const { t } = useTranslation();

  if (gtins.length === 0) return null;

  return (
    <div className="space-y-2">
      {gtins.map((gtin) => {
        const medicine = Object.getOwnPropertyDescriptor(medicines, gtin)?.value;
        const isLoading = loadingGtin === gtin;

        return (
          <div key={gtin} className="flex justify-between items-center p-3 border rounded-md bg-card">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                {t('scanner.searching')}
              </div>
            ) : medicine ? (
              <div className="flex-1">
                <h6 className="font-semibold text-primary mb-1">
                  {medicine.name}
                  {medicine.dose && ` (${medicine.dose} mg)`}
                </h6>
                {medicine.box_capacity && (
                  <p className="text-sm text-muted-foreground">{t('scanner.quantity', { quantity: medicine.box_capacity })}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                {t('scanner.medicine_not_found')}
              </div>
            )}

            {medicine && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemoveMedicine(gtin)}
                title={t('scanner.remove_from_list')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
