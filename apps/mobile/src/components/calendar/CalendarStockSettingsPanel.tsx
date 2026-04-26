import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import type { MobileCalendarStockSettingsProps, StockDecrementMethod } from '@meditime/types';
import { SettingsPanelSection } from '../settings';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

type StockOption = {
  id: StockDecrementMethod;
  label: string;
  description: string;
};

export function CalendarStockSettingsPanel({
  selectedMethod,
  isSaving,
  onSelectMethod,
}: MobileCalendarStockSettingsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();

  const options: StockOption[] = [
    {
      id: STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX,
      label: String(t('calendar_settings.stock.weekly.label')),
      description: String(t('calendar_settings.stock.weekly.description')),
    },
    {
      id: STOCK_DECREMENT_METHODS.DAILY_MIDNIGHT,
      label: String(t('calendar_settings.stock.daily.label')),
      description: String(t('calendar_settings.stock.daily.description')),
    },
  ];

  return (
    <SettingsPanelSection
      glass
      iconName="cube-outline"
      title={String(t('calendar_settings.stock.label'))}
      description={String(t('calendar_settings.stock.description'))}
    >
      <YStack style={{ gap: 10 }}>
        {options.map((option) => {
          const selected = option.id === selectedMethod;

          return (
            <Pressable
              key={option.id}
              onPress={() => {
                if (!selected) hapticSelection();
                onSelectMethod(option.id);
              }}
              disabled={isSaving}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: isSaving }}
            >
              {({ pressed }) => (
                <GlassView
                  colorScheme={colorScheme}
                  glassEffectStyle="clear"
                  style={{
                    borderRadius: 18,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    opacity: isSaving ? 0.65 : 1,
                  }}
                >
                  <XStack style={{ alignItems: 'flex-start', gap: 12, opacity: pressed ? 0.75 : 1 }}>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? ios.primary : ios.mutedForeground}
                    />
                    <YStack style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 21, fontWeight: '800' }}>
                        {option.label}
                      </Text>
                      <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
                        {option.description}
                      </Text>
                    </YStack>
                  </XStack>
                </GlassView>
              )}
            </Pressable>
          );
        })}
      </YStack>
    </SettingsPanelSection>
  );
}
