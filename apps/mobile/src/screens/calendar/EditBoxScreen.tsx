import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from 'tamagui';
import type { EditableCondition, EditingBoxState } from '@meditime/types';
import { GlassView } from 'expo-glass-effect';
import { GlassSurface } from '../../components/common/GlassSurface';
import { LiquidButton } from '../../components/common/LiquidButton';
import { usePageHeaderOptions } from '../../components/common/Page';
import { MedicineSearchInput } from '../../components/calendar/MedicineSearchInput';
import { ReviewField } from '../../components/calendar/import/ReviewField';
import { ConditionItem } from '../../components/calendar/ConditionItem';
import { editBoxStore } from '../../stores/editBoxStore';
import { useAppTheme, useIosTheme } from '../../theme/ios';

function toNumber(value: string) {
  return value.trim() === '' ? null : Number(value);
}

export default function EditBoxScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const scrollRef = useRef<ScrollView>(null);
  const capacityRef = useRef<TextInput>(null);
  const stockRef = useRef<TextInput>(null);
  const thresholdRef = useRef<TextInput>(null);
  const [showThreshold, setShowThreshold] = useState(false);
  const [saving, setSaving] = useState(false);
  const [box, setBox] = useState<EditingBoxState | null>(() => editBoxStore.editingBox);

  const isNew = editBoxStore.boxId?.startsWith('temp-') ?? false;

  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      editBoxStore.onCancel?.();
      editBoxStore.clear();
    });
  }, [navigation]);

  function update(next: EditingBoxState) {
    setBox(next);
    editBoxStore.update(next);
  }

  function set<K extends keyof EditingBoxState>(field: K, value: EditingBoxState[K]) {
    if (!box) return;
    update({ ...box, [field]: value });
  }

  function addCondition() {
    if (!box) return;
    const id = `cond-${Date.now()}`;
    update({ ...box, conditions: { ...box.conditions, [id]: { id, tablet_count: 1, interval_days: 1, start_date: null, time_of_day: 'morning', max_date: null, max_date_mode: 'none', max_date_days: null } } });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function deleteCondition(id: string) {
    if (!box) return;
    const next = { ...box.conditions };
    delete next[id];
    update({ ...box, conditions: next });
  }

  const updateCondition = useCallback((id: string, changes: Partial<EditableCondition>) => {
    setBox((prev) => {
      if (!prev) return prev;
      const cond = prev.conditions[id];
      if (!cond) return prev;
      const next = { ...prev, conditions: { ...prev.conditions, [id]: { ...cond, ...changes } } };
      editBoxStore.update(next);
      return next;
    });
  }, []);

  function handleCancel() {
    editBoxStore.onCancel?.();
    editBoxStore.clear();
    router.back();
  }

  async function handleSave() {
    if (!box?.name.trim()) {
      Alert.alert(String(t('error')), String(t('boxes.name')));
      return;
    }
    setSaving(true);
    try {
      await editBoxStore.onSave?.();
      editBoxStore.clear();
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const headerOptions = usePageHeaderOptions({
    title: String(isNew ? t('boxes.add_manual') : t('boxes.edit')),
    headerBackButtonDisplayMode: 'minimal' as const,
  });

  if (!box) return null;

  const conditions = Object.values(box.conditions ?? {}).filter((c): c is EditableCondition => Boolean(c));
  const canSubmit = Boolean(box.name.trim());

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          ...headerOptions,
          headerRight: () => (
            <Pressable onPress={handleCancel} accessibilityRole="button">
              {({ pressed }) => (
                <Text style={{ color: ios.primary, fontSize: 17, opacity: pressed ? 0.6 : 1 }}>
                  {t('cancel')}
                </Text>
              )}
            </Pressable>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View style={{ gap: 16 }}>
          {/* Champs principaux */}
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="regular"
            style={{ borderRadius: 20, padding: 14, gap: 16 }}
          >
            <MedicineSearchInput
              name={box.name}
              dose={box.dose ?? null}
              onChangeName={(v) => set('name', v)}
              onChangeDose={(v) => set('dose', toNumber(v))}
              onApplySuggestion={(updates) => update({ ...box, ...updates })}
              nextRef={capacityRef}
            />
            <ReviewField ref={capacityRef} label={String(t('boxes.capacity'))} value={String(box.box_capacity ?? '')} keyboardType="numeric" onChangeText={(v) => set('box_capacity', toNumber(v))} returnKeyType="next" onSubmitEditing={() => stockRef.current?.focus()} />
            <ReviewField ref={stockRef} label={String(t('boxes.remaining_qty'))} value={String(box.stock_quantity ?? '')} keyboardType="numeric" onChangeText={(v) => set('stock_quantity', toNumber(v))} returnKeyType="done" />

            {/* Seuil d'alerte */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {showThreshold ? (
                  <ReviewField ref={thresholdRef} size="sm" muted label={String(t('boxes.alert_threshold'))} value={String(box.stock_alert_threshold ?? '')} keyboardType="numeric" onChangeText={(v) => set('stock_alert_threshold', toNumber(v))} returnKeyType="done" onSubmitEditing={() => setShowThreshold(false)} />
                ) : (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="notifications-outline" size={14} color={ios.mutedForeground} />
                    <Text style={{ color: ios.mutedForeground, fontSize: 13 }}>
                      {`${t('boxes.alert_threshold')} : ${box.stock_alert_threshold ?? 10}`}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => setShowThreshold((v) => !v)}>
                {({ pressed }) => (
                  <GlassSurface glassEffectStyle="regular" style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, opacity: pressed ? 0.72 : 1 }}>
                    <Ionicons name={showThreshold ? 'close' : 'pencil-outline'} size={16} color={ios.primary} />
                  </GlassSurface>
                )}
              </Pressable>
            </View>
          </GlassView>

          {/* Conditions */}
          <View style={{ gap: 10 }}>
            <Text style={{ color: ios.foreground, fontSize: 16, fontWeight: '800' }}>
              {t('boxes.intake_conditions')}
            </Text>
            {conditions.map((cond) => (
              <ConditionItem key={cond.id} condition={cond} onDelete={() => deleteCondition(cond.id)} onUpdate={(changes) => updateCondition(cond.id, changes)} />
            ))}
            <LiquidButton iconName="add-circle-outline" label={String(t('boxes.condition.add'))} onPress={addCondition} tone="primary" />
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <LiquidButton iconName="close-circle-outline" label={String(t('cancel'))} onPress={handleCancel} tone="plain" />
            </View>
            <View style={{ flex: 1 }}>
              <LiquidButton disabled={saving || !canSubmit} loading={saving} iconName="checkmark-circle-outline" label={String(t('boxes.save'))} onPress={() => { void handleSave(); }} tone="success" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
