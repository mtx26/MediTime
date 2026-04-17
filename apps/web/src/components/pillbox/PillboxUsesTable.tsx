import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import type { PillboxUseItem } from '@meditime/types';

interface PillboxUsesTableProps {
  uses: PillboxUseItem[];
  formatWeek: (dateString: string) => string;
  onCancel: (useId: string) => void;
}

function PillboxUsesTable({ uses, formatWeek, onCancel }: PillboxUsesTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted border-b">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">{t('week')}</th>
            <th className="px-4 py-3 text-left font-semibold">{t('prepared_by')}</th>
            <th className="px-4 py-3 text-right font-semibold">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {uses.map((use) => (
            <tr key={use.id} className="hover:bg-muted/50 transition">
              <td className="px-4 py-3">{formatWeek(use.prepared_at)}</td>
              <td className="px-4 py-3">
                <HoveredUserProfile
                  user={use.prepared_by}
                  trigger={<span>{use.prepared_by.display_name}</span>}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(use.id)}
                  title={t('restore')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('restore')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PillboxUsesTable;
