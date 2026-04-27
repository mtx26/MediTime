import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import NativeSegmentedControl from '@react-native-segmented-control/segmented-control';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

// ─── Date Field ─────────────────────────────────────────────────────────────

function DateField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
}) {
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const displayDate = value ?? new Date();

  return (
    <YStack style={{ gap: 7, alignItems: 'flex-start' }}>
      <Text style={{ color: ios.foreground, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <DateTimePicker
        value={displayDate}
        mode="date"
        display="compact"
        onChange={(_: DateTimePickerEvent, date?: Date) => onChange(date ?? null)}
        minimumDate={minimumDate}
        themeVariant={colorScheme}
        accentColor={ios.primary}
      />
    </YStack>
  );
}

// ─── Segmented Control ───────────────────────────────────────────────────────

type SegmentedOption = { value: string; label: string };

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const ios = useIosTheme();
  const { isDark } = useAppTheme();
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  return (
    <YStack style={{ gap: 7 }}>
      <Text style={{ color: ios.foreground, fontSize: 14, fontWeight: '700' }}>{label}</Text>
      <NativeSegmentedControl
        values={options.map((opt) => opt.label)}
        selectedIndex={selectedIndex < 0 ? 0 : selectedIndex}
        onChange={(event) => {
          const idx = event.nativeEvent.selectedSegmentIndex;
          onChange(options[idx]?.value ?? options[0].value);
        }}
        tintColor={ios.primary}
        appearance={isDark ? 'dark' : 'light'}
        fontStyle={{ color: isDark ? '#ffffff' : '#000000', fontWeight: '600' }}
        activeFontStyle={{ color: '#ffffff', fontWeight: '700' }}
        style={{ height: 36 }}
      />
    </YStack>
  );
}

// ─── Condition Item ──────────────────────────────────────────────────────────

function ConditionItem({
  condition,
  onDelete,
  onUpdate,
}: {
  condition: EditableCondition;
  onDelete: () => void;
  onUpdate: (updates: Partial<EditableCondition>) => void;
}) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  const intervalDays = Number(condition.interval_days ?? 1);
  const maxDateMode = condition.max_date_mode ?? 'none';

  const handleIntervalDaysChange = (value: string) => {
    const num = value.trim() === '' ? null : Number(value);
    if ((num ?? 0) <= 1) {
      onUpdate({ interval_days: num ?? undefined, start_date: null });
    } else {
      onUpdate({ interval_days: num ?? undefined });
    }
  };

  const handleMaxDateModeChange = (mode: string) => {
    onUpdate({
      max_date_mode: mode as EditableCondition['max_date_mode'],
      max_date: null,
      max_date_days: null,
    });
  };

  const handleMaxDateDaysChange = (value: string) => {
    if (!value || value.trim() === '') {
      onUpdate({ max_date: null, max_date_days: null });
      return;
    }
    const daysValue = parseInt(value, 10);
    const now = new Date();
    const target = new Date(now);
    const hourByTime: Record<string, number> = { morning: 8, noon: 12, evening: 18 };
    const targetHour = condition.time_of_day ? (hourByTime[condition.time_of_day] ?? 8) : 8;
    target.setHours(targetHour, 0, 0, 0);
    const includeToday = now < target;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (includeToday ? daysValue - 1 : daysValue));
    endDate.setHours(23, 59, 59, 999);
    onUpdate({ max_date: endDate.toISOString(), max_date_days: daysValue });
  };

  const handleUntilDateChange = (date: Date | null) => {
    if (!date) return;
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    onUpdate({ max_date: d.toISOString() });
  };

  const handleStartDateChange = (date: Date | null) => {
    onUpdate({ start_date: date ? date.toISOString() : null });
  };

  return (
    <GlassSurface
      glassEffectStyle="clear"
      surfaceTone="subtle"
      style={{ gap: 12, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 }}
    >
      {/* Header: delete */}
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: ios.mutedForeground, fontSize: 13, fontWeight: '700' }}>
          {t('boxes.intake_conditions')}
        </Text>
        <Pressable accessibilityRole="button" onPress={onDelete}>
          {({ pressed }) => (
            <YStack style={{
              width: 32, height: 32,
              alignItems: 'center', justifyContent: 'center',
              borderRadius: 16,
              backgroundColor: pressed ? ios.destructiveBg : ios.accentHover,
            }}>
              <Ionicons name="trash-outline" size={16} color={ios.destructive} />
            </YStack>
          )}
        </Pressable>
      </XStack>

      {/* Tablet count */}
      <ReviewField
        label={String(t('boxes.condition.tablet_count'))}
        value={String(condition.tablet_count ?? '')}
        keyboardType="numeric"
        required
        size="sm"
        muted
        onChangeText={(v) => onUpdate({ tablet_count: v.trim() === '' ? undefined : parseFloat(v) })}
      />

      {/* Time of day */}
      <SegmentedControl
        label={String(t('boxes.condition.time_of_day'))}
        value={condition.time_of_day ?? 'morning'}
        options={[
          { value: 'morning', label: String(t('morning')) },
          { value: 'noon', label: String(t('noon')) },
          { value: 'evening', label: String(t('evening')) },
        ]}
        onChange={(v) => onUpdate({ time_of_day: v as EditableCondition['time_of_day'] })}
      />

      {/* Interval days */}
      <ReviewField
        label={String(t('boxes.condition.interval_days'))}
        value={String(condition.interval_days ?? '')}
        keyboardType="numeric"
        required
        size="sm"
        muted
        onChangeText={handleIntervalDaysChange}
      />

      {/* Start date – only when interval > 1 */}
      {intervalDays > 1 ? (
        <DateField
          label={String(t('boxes.condition.start_date'))}
          value={condition.start_date ? new Date(condition.start_date) : null}
          onChange={handleStartDateChange}
        />
      ) : null}

      {/* Max date mode */}
      <SegmentedControl
        label={String(t('boxes.condition.max_date_mode'))}
        value={maxDateMode}
        options={[
          { value: 'none', label: String(t('boxes.condition.no_limit')) },
          { value: 'until_date', label: String(t('boxes.condition.until_date')) },
          { value: 'for_days', label: String(t('boxes.condition.for_days')) },
        ]}
        onChange={handleMaxDateModeChange}
      />

      {/* Max date value – only when mode is not 'none' */}
      {maxDateMode === 'for_days' ? (
        <ReviewField
          label={String(t('boxes.condition.duration_days'))}
          value={String(condition.max_date_days ?? '')}
          keyboardType="numeric"
          required
          size="sm"
          muted
          onChangeText={handleMaxDateDaysChange}
        />
      ) : null}
      {maxDateMode === 'until_date' ? (
        <DateField
          label={String(t('boxes.condition.end_date'))}
          value={condition.max_date ? new Date(condition.max_date) : null}
          onChange={handleUntilDateChange}
          minimumDate={new Date()}
        />
      ) : null}
    </GlassSurface>
  );
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

  const isNew = Boolean(editingBoxId?.startsWith('temp-'));

  const setField = <Key extends keyof EditingBoxState>(field: Key, value: EditingBoxState[Key]) => {
    if (!editingBox) return;
    onChange({ ...editingBox, [field]: value });
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

                      {/* Name */}
                      <ReviewField
                        label={String(t('boxes.name'))}
                        value={editingBox.name}
                        required
                        onChangeText={(value) => setField('name', value)}
                        returnKeyType="next"
                        onSubmitEditing={() => doseInputRef.current?.focus()}
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

                      {/* Capacity + Alert Threshold */}
                      <XStack style={{ gap: 12 }}>
                        <YStack style={{ flex: 1 }}>
                          <ReviewField
                            ref={capacityInputRef}
                            label={String(t('boxes.capacity'))}
                            value={String(editingBox.box_capacity ?? '')}
                            keyboardType="numeric"
                            onChangeText={(value) => setField('box_capacity', setNumberText(value))}
                            returnKeyType="next"
                            onSubmitEditing={() => stockInputRef.current?.focus()}
                          />
                        </YStack>
                        <YStack style={{ flex: 1 }}>
                          <ReviewField
                            ref={thresholdInputRef}
                            label={String(t('boxes.alert_threshold'))}
                            value={String(editingBox.stock_alert_threshold ?? '')}
                            keyboardType="numeric"
                            onChangeText={(value) => setField('stock_alert_threshold', setNumberText(value))}
                          />
                        </YStack>
                      </XStack>

                      {/* Stock Quantity */}
                      <ReviewField
                        ref={stockInputRef}
                        label={String(t('boxes.remaining_qty'))}
                        value={String(editingBox.stock_quantity ?? '')}
                        keyboardType="numeric"
                        onChangeText={(value) => setField('stock_quantity', setNumberText(value))}
                      />

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
