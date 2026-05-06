import { useRef } from 'react';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MedicineReviewMedicineInput } from '@meditime/types';
import { IconButton } from '../../common/IconButton';
import { InfoBanner } from '../../common/InfoBanner';
import { LiquidButton } from '../../common/LiquidButton';
import { MobileForm } from '../../common/MobileForm';
import { OutlineButton } from '../../common/OutlineButton';
import { useIosTheme } from '../../../theme/ios';
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
  const ios = useIosTheme();
  const current = medicines[index];
  const nameInputRef = useRef<TextInput>(null);
  const doseInputRef = useRef<TextInput>(null);
  const stockQuantityInputRef = useRef<TextInput>(null);
  const stockMaxInputRef = useRef<TextInput>(null);
  const stockAlertInputRef = useRef<TextInput>(null);

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
  const canSubmit = Boolean(String(current.name ?? '').trim());

  return (
    <MobileForm
      onSubmit={canGoNext ? () => onIndexChange(index + 1) : onSave}
      disabled={disabled || !canSubmit}
      style={{ gap: 16, padding: 20 }}
    >
      {(form) => (
        <>
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
            ref={nameInputRef}
            label={t('boxes.name')}
            value={String(current.name ?? '')}
            required
            onChangeText={(value) => onFieldChange(index, 'name', value)}
            returnKeyType="next"
            onSubmitEditing={() => doseInputRef.current?.focus()}
          />
          <ReviewField
            ref={doseInputRef}
            label={t('boxes.dose')}
            value={String(current.dose ?? '')}
            keyboardType="numeric"
            required
            onChangeText={(value) => onFieldChange(index, 'dose', value)}
            returnKeyType="next"
            onSubmitEditing={() => stockQuantityInputRef.current?.focus()}
          />
          <ReviewField
            ref={stockQuantityInputRef}
            label={t('medicine_review.current_stock')}
            value={String(current.stock_quantity ?? '')}
            keyboardType="numeric"
            onChangeText={(value) => onFieldChange(index, 'stock_quantity', value)}
            returnKeyType="next"
            onSubmitEditing={() => stockMaxInputRef.current?.focus()}
          />
          <ReviewField
            ref={stockMaxInputRef}
            label={t('medicine_review.maximum_stock')}
            value={String(current.stock_max ?? '')}
            keyboardType="numeric"
            onChangeText={(value) => onFieldChange(index, 'stock_max', value)}
            returnKeyType="next"
            onSubmitEditing={() => stockAlertInputRef.current?.focus()}
          />
          <ReviewField
            ref={stockAlertInputRef}
            label={t('boxes.alert_threshold')}
            value={String(current.stock_alert_threshold ?? '')}
            keyboardType="numeric"
            onChangeText={(value) => onFieldChange(index, 'stock_alert_threshold', value)}
            {...form.getInputProps()}
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
            <LiquidButton
              label={canGoNext ? t('next') : t('medicine_review.finish')}
              iconName={canGoNext ? 'chevron-forward' : 'checkmark-circle-outline'}
              tone={canGoNext ? 'primary' : 'success'}
              onPress={form.submit}
              disabled={disabled || !canSubmit}
            />
          </XStack>
        </>
      )}
    </MobileForm>
  );
}
