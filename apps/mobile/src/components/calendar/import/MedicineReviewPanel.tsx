import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, XStack, YStack } from 'tamagui';
import type { MedicineReviewMedicineInput } from '@meditime/types';
import { IconButton } from '../../common/IconButton';
import { InfoBanner } from '../../common/InfoBanner';
import { OutlineButton } from '../../common/OutlineButton';
import { ios } from '../../../theme/ios';
import type { MedicineReviewField } from './types';
import { ReviewField } from './ReviewField';

type MedicineReviewPanelProps = {
  medicines: MedicineReviewMedicineInput[];
  index: number;
  disabled: boolean;
  onIndexChange: (index: number) => void;
  onFieldChange: (index: number, field: MedicineReviewField, value: string) => void;
  onRemoveMedicine: (index: number) => void;
  onBack: () => void;
  onSave: () => void;
};

export function MedicineReviewPanel({
  medicines,
  index,
  disabled,
  onIndexChange,
  onFieldChange,
  onRemoveMedicine,
  onBack,
  onSave,
}: MedicineReviewPanelProps) {
  const { t } = useTranslation();
  const current = medicines[index];

  if (!current) {
    return (
      <YStack style={{ gap: 12, padding: 20 }}>
        <InfoBanner iconName="warning-outline" tone="warning" text={t('image_upload.no_medicines_found')} />
        <OutlineButton label={t('previous')} onPress={onBack} />
      </YStack>
    );
  }

  const canGoPrev = index > 0;
  const canGoNext = index < medicines.length - 1;

  return (
    <YStack style={{ gap: 16, padding: 20 }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 26, fontWeight: '800' }}>
            {t('medicine_review.title')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 14, marginTop: 3 }}>
            {index + 1} / {medicines.length}
          </Text>
        </YStack>
        <IconButton
          label={t('medicine_review.delete_medicine')}
          iconName="trash-outline"
          disabled={disabled}
          onPress={() => onRemoveMedicine(index)}
        />
      </XStack>

      <ReviewField
        label={t('boxes.name')}
        value={String(current.name ?? '')}
        required
        onChangeText={(value) => onFieldChange(index, 'name', value)}
      />
      <ReviewField
        label={t('boxes.dose')}
        value={String(current.dose ?? '')}
        keyboardType="numeric"
        required
        onChangeText={(value) => onFieldChange(index, 'dose', value)}
      />
      <ReviewField
        label={t('medicine_review.current_stock')}
        value={String(current.stock_quantity ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_quantity', value)}
      />
      <ReviewField
        label={t('medicine_review.maximum_stock')}
        value={String(current.stock_max ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_max', value)}
      />
      <ReviewField
        label={t('boxes.alert_threshold')}
        value={String(current.stock_alert_threshold ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_alert_threshold', value)}
      />

      <InfoBanner
        iconName="calendar-outline"
        text={`${t('boxes.intake_conditions')}: ${current.conditions?.length ?? 0}`}
      />

      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <IconButton
          label={t('previous')}
          iconName="chevron-back"
          disabled={disabled || !canGoPrev}
          onPress={() => onIndexChange(index - 1)}
        />
        <OutlineButton label={t('previous')} onPress={onBack} />
        <Button
          size="$3"
          onPress={canGoNext ? () => onIndexChange(index + 1) : onSave}
          disabled={disabled || !String(current.name ?? '').trim()}
          style={{
            minHeight: 40,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: canGoNext ? ios.primary : '#34c759',
            opacity: disabled || !String(current.name ?? '').trim() ? 0.55 : 1,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name={canGoNext ? 'chevron-forward' : 'checkmark-circle-outline'} size={16} color={ios.card} />
            <Text style={{ color: ios.card, fontWeight: '800' }}>
              {canGoNext ? t('next') : t('medicine_review.finish')}
            </Text>
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}
