import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text, YStack } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { fetchSuggestionsFromSupabase } from '@meditime/utils';
import type { MedicineReviewSuggestion } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

type MedicineSearchInputProps = {
  name: string;
  dose: number | null;
  onChangeName: (value: string) => void;
  onApplySuggestion: (updates: {
    name: string;
    dose: number | null;
    box_capacity: number | null;
    stock_quantity: number | null;
    code_fmd: string | null;
  }) => void;
  onAfterSelect?: () => void;
  nextRef?: React.RefObject<TextInput | null>;
};

export function MedicineSearchInput({
  name,
  dose,
  onChangeName,
  onApplySuggestion,
  onAfterSelect,
  nextRef,
}: MedicineSearchInputProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const [suggestions, setSuggestions] = useState<MedicineReviewSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (skipNextFetch.current) {
        skipNextFetch.current = false;
        return;
      }
      if (!name || name.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      const results = await fetchSuggestionsFromSupabase({
        supabaseUrl: SUPABASE_URL,
        supabaseAnonKey: SUPABASE_ANON_KEY,
        name,
        dose,
        limit: 40,
      });
      setSuggestions(results ?? []);
      setShowDropdown((results ?? []).length > 0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [name, dose]);

  const handleSelect = (item: MedicineReviewSuggestion) => {
    const parsedDose = parseInt(String(item.dose ?? '').replace(/\D/g, ''), 10) || 0;
    const parsedCapacity = Number(item.conditionnement) || 0;
    onApplySuggestion({
      name: item.name,
      dose: parsedDose,
      box_capacity: parsedCapacity,
      stock_quantity: parsedCapacity,
      code_fmd: item.code_fmd ?? null,
    });
    setSuggestions([]);
    setShowDropdown(false);
    skipNextFetch.current = true;
    onAfterSelect?.();
  };

  return (
    <YStack style={{ gap: 7 }}>
      <Text style={{ color: ios.foreground, fontSize: 13, fontWeight: '700' }}>
        {t('boxes.name')} <Text style={{ color: ios.destructive }}>*</Text>
      </Text>
      <TextInput
        ref={inputRef}
        value={name}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onChangeText={(v) => {
          onChangeName(v);
          setShowDropdown(true);
        }}
        placeholder={String(t('boxes.start_typing'))}
        placeholderTextColor={ios.mutedForeground}
        returnKeyType="next"
        autoCorrect={false}
        autoCapitalize="none"
        onSubmitEditing={() => nextRef?.current?.focus()}
        style={{
          backgroundColor: ios.card,
          color: ios.foreground,
          borderRadius: 10,
          minHeight: 44,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: ios.card, borderColor: ios.border },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 220 }}
          >
            {suggestions.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  { backgroundColor: pressed ? ios.accentHover : 'transparent' },
                ]}
              >
                <Text
                  style={{ color: ios.foreground, fontSize: 14, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={{ color: ios.mutedForeground, fontSize: 12 }} numberOfLines={1}>
                  {item.dose}{item.conditionnement ? ` · ${item.conditionnement}` : ''}{item.forme_pharmaceutique ? ` · ${item.forme_pharmaceutique}` : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
});
