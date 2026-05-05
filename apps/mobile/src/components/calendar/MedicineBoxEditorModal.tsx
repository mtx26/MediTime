import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { EditableCondition, EditingBoxState } from '@meditime/types';
import { GlassSurface } from '../common/GlassSurface';
import { LiquidButton } from '../common/LiquidButton';
import { MobileForm } from '../common/MobileForm';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { ReviewField } from './import/ReviewField';
import { MedicineSearchInput } from './MedicineSearchInput';
import { ConditionItem } from './ConditionItem';

type MedicineBoxEditorModalProps = {
  disabled?: boolean;
  editingBox: EditingBoxState | null;
  editingBoxId?: string | null;
  onCancel: () => void;
  onChange: (editingBox: EditingBoxState) => void;
  onSave: () => void;
};

function setNumberText(value: string) {
  if (value.trim() === '') return null;
  return Number(value);
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function MedicineBoxEditorModal({
  disabled = false,
  editingBox,
  editingBoxId,
  onCancel,
  onChange,
  onSave,
}: MedicineBoxEditorModalProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const doseInputRef = useRef<TextInput>(null);
  const capacityInputRef = useRef<TextInput>(null);
  const stockInputRef = useRef<TextInput>(null);
  const thresholdInputRef = useRef<TextInput>(null);
  const [showThresholdInput, setShowThresholdInput] = useState(false);

  const isNew = Boolean(editingBoxId?.startsWith('temp-'));

  const setField = <Key extends keyof EditingBoxState>(field: Key, value: EditingBoxState[Key]) => {
    if (!editingBox) return;
    onChange({ ...editingBox, [field]: value });
  };

  const setFields = (updates: Partial<EditingBoxState>) => {
    if (!editingBox) return;
    onChange({ ...editingBox, ...updates });
  };

  const conditions = editingBox
    ? Object.values(editingBox.conditions ?? {}).filter((c): c is EditableCondition => Boolean(c))
    : [];

  const addCondition = () => {
    if (!editingBox) return;
    const id = `cond-${Date.now()}`;
    const newCond: EditableCondition = {
      id,
      tablet_count: 1,
      interval_days: 1,
      start_date: null,
      time_of_day: 'morning',
      max_date: null,
      max_date_mode: 'none',
      max_date_days: null,
    };
    onChange({ ...editingBox, conditions: { ...editingBox.conditions, [id]: newCond } });
  };

  const deleteCondition = (id: string) => {
    if (!editingBox) return;
    const next = { ...editingBox.conditions };
    delete next[id];
    onChange({ ...editingBox, conditions: next });
  };

  const updateConditionFields = (
    id: string,
    updates: Partial<EditableCondition>,
  ) => {
    if (!editingBox) return;
    const cond = editingBox.conditions[id];
    if (!cond) return;
    onChange({
      ...editingBox,
      conditions: { ...editingBox.conditions, [id]: { ...cond, ...updates } },
    });
  };

  const canSubmit = Boolean(editingBox?.name.trim());

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      transparent
      visible={Boolean(editingBox)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <YStack style={styles.sheetWrap}>
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="regular"
            style={{
              maxHeight: '100%',
              borderRadius: 28,
              padding: 8,
            }}
          >
            {editingBox ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 12 }}
              >
                <MobileForm
                  disabled={disabled || !canSubmit}
                  onSubmit={onSave}
                  style={{ gap: 16 }}
                >
                  {(form) => (
                    <>
                      {/* Title */}
                      <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <YStack style={{ flex: 1, gap: 4 }}>
                          <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 26, fontWeight: '900' }}>
                            {isNew ? t('boxes.add_manual') : t('boxes.edit')}
                          </Text>
                          <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 19 }}>
                            {t('boxes.title')}
                          </Text>
                        </YStack>
                        <Pressable onPress={onCancel}>
                          {({ pressed }) => (
                            <GlassView
                              colorScheme={colorScheme}
                              glassEffectStyle="regular"
                              style={{
                                width: 32,
                                height: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 16,
                                borderWidth: 0.5,
                                borderColor: ios.border,
                                overflow: 'hidden',
                                opacity: pressed ? 0.72 : 1,
                              }}
                            >
                              <Ionicons name="close" size={16} color={ios.primary} />
                            </GlassView>
                          )}
                        </Pressable>
                      </XStack>

                      {/* Name + Dose (avec autocomplétion) */}
                      <MedicineSearchInput
                        name={editingBox.name}
                        dose={editingBox.dose ?? null}
                        onChangeName={(value) => setField('name', value)}
                        onApplySuggestion={(updates) => setFields(updates)}
                        nextRef={capacityInputRef}
                      />

                      {/* Dose */}
                      <ReviewField
                        ref={doseInputRef}
                        label={String(t('boxes.dose'))}
                        value={String(editingBox.dose ?? '')}
                        keyboardType="numeric"
                        onChangeText={(value) => setField('dose', setNumberText(value))}
                        returnKeyType="next"
                        onSubmitEditing={() => capacityInputRef.current?.focus()}
                      />

                      {/* Capacity */}
                      <ReviewField
                        ref={capacityInputRef}
                        label={String(t('boxes.capacity'))}
                        value={String(editingBox.box_capacity ?? '')}
                        keyboardType="numeric"
                        onChangeText={(value) => setField('box_capacity', setNumberText(value))}
                        returnKeyType="next"
                        onSubmitEditing={() => stockInputRef.current?.focus()}
                      />

                      {/* Stock Quantity */}
                      <ReviewField
                        ref={stockInputRef}
                        label={String(t('boxes.remaining_qty'))}
                        value={String(editingBox.stock_quantity ?? '')}
                        keyboardType="numeric"
                        onChangeText={(value) => setField('stock_quantity', setNumberText(value))}
                        returnKeyType="done"
                      />

                      {/* Alert Threshold Switch */}
                      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <XStack style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                          {showThresholdInput ? (
                            <YStack style={{ flex: 1 }}>
                              <ReviewField
                                ref={thresholdInputRef}
                                size="sm"
                                muted
                                label={String(t('boxes.alert_threshold'))}
                                value={String(editingBox.stock_alert_threshold ?? '')}
                                keyboardType="numeric"
                                onChangeText={(value) => setField('stock_alert_threshold', setNumberText(value))}
                                returnKeyType="done"
                                onSubmitEditing={() => setShowThresholdInput(false)}
                              />
                            </YStack>
                          ) : (
                            <XStack style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                              <Ionicons name="notifications-outline" size={14} color={ios.mutedForeground} />
                              <Text style={{ color: ios.mutedForeground, fontSize: 13 }}>
                                {`${t('boxes.alert_threshold')} : ${editingBox.stock_alert_threshold ?? 10}`}
                              </Text>
                            </XStack>
                          )}
                        </XStack>
                        <Pressable onPress={() => setShowThresholdInput((v) => !v)}>
                          {({ pressed }) => (
                            <GlassView
                              colorScheme={colorScheme}
                              glassEffectStyle="regular"
                              style={{
                                width: 32,
                                height: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 16,
                                borderWidth: 0.5,
                                borderColor: ios.border,
                                overflow: 'hidden',
                                opacity: pressed ? 0.72 : 1,
                              }}
                            >
                              <Ionicons name={showThresholdInput ? 'close' : 'pencil-outline'} size={16} color={ios.primary} />
                            </GlassView>
                          )}
                        </Pressable>
                      </XStack>

                      {/* Conditions */}
                      <YStack style={{ gap: 10 }}>
                        <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '800' }}>
                          {t('boxes.intake_conditions')}
                        </Text>

                        {conditions.map((cond) => (
                          <ConditionItem
                            key={cond.id}
                            condition={cond}
                            onDelete={() => deleteCondition(cond.id)}
                            onUpdate={(updates) => updateConditionFields(cond.id, updates)}
                          />
                        ))}

                        <LiquidButton
                          iconName="add-circle-outline"
                          label={String(t('boxes.condition.add'))}
                          onPress={addCondition}
                          tone="primary"
                        />
                      </YStack>

                      {/* Actions */}
                      <LiquidButton
                        disabled={disabled || !canSubmit}
                        iconName="checkmark-circle-outline"
                        label={String(t('boxes.save'))}
                        onPress={form.submit}
                        tone="success"
                      />
                    </>
                  )}
                </MobileForm>
              </ScrollView>
            ) : null}
          </GlassView>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
});
