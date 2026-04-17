import { useTranslation } from 'react-i18next';
import IconButton from '@/components/common/UtilityComponents';
import { PlusCircle, Package } from 'lucide-react';

interface BoxRestockActionsProps {
  boxId: string;
  stockQuantity: number;
  boxCapacity: number;
  onRestock: (id: string) => void;
  onMissingPillbox?: (id: string) => void;
}

function BoxRestockActions({ boxId, stockQuantity, boxCapacity, onRestock, onMissingPillbox }: BoxRestockActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex-1">
        <IconButton
          className="w-full border-green-500 text-green-600 hover:bg-green-50"
          icon={PlusCircle}
          text={t('boxes.restock')}
          onClick={() => onRestock(boxId)}
          disabled={boxCapacity === 0}
          helpDisabled={t('boxes.restock_disabled_tooltip')}
        />
      </div>
      {stockQuantity < 0 && onMissingPillbox && (
        <div className="flex-1">
          <IconButton
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            icon={Package}
            text={t('boxes.missing_pillbox')}
            onClick={() => onMissingPillbox(boxId)}
          />
        </div>
      )}
    </div>
  );
}

export default BoxRestockActions;
