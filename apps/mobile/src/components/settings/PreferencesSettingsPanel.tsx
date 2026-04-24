import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MobilePreferencesSettingsProps } from '@meditime/types';
import type { AppThemePreference } from '../../theme/ios';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useAppTheme, useIosTheme } from '../../theme/ios';

const THEME_ICONS: Record<AppThemePreference, keyof typeof Ionicons.glyphMap> = {
  system: 'contrast-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
};

export function PreferencesSettingsPanel({
  language,
  languages,
  themePreference,
  onLanguageChange,
  onThemePreferenceChange,
}: MobilePreferencesSettingsProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const themeOptions: AppThemePreference[] = ['system', 'light', 'dark'];

  return (
    <YStack style={{ gap: 14 }}>
      <YStack style={{ gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('settings.preferences')}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {t('settings.preferences_desc')}
        </Text>
      </YStack>

      <SettingsPanelSection
        glass
        iconName="language-outline"
        title={String(t('settings.language'))}
        description={String(t('settings.language_note'))}
      >
        <YStack style={{ gap: 8 }}>
          {languages.map((item) => {
            const active = language.startsWith(item.code);

            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onLanguageChange(item.code)}
              >
                {({ pressed }) => (
                  <XStack
                    style={{
                      minHeight: 42,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: active ? ios.primary : ios.border,
                      backgroundColor: active ? ios.blueInfoBg : ios.background,
                      opacity: pressed ? 0.75 : 1,
                    }}
                  >
                    <XStack style={{ alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <YStack
                        style={{
                          minWidth: 36,
                          minHeight: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: ios.card,
                          borderWidth: 1,
                          borderColor: ios.border,
                        }}
                      >
                        <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '800' }}>
                          {(item.flag ?? item.code).toUpperCase()}
                        </Text>
                      </YStack>
                      <Text
                        numberOfLines={1}
                        style={{ flex: 1, color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}
                      >
                        {item.label}
                      </Text>
                    </XStack>
                    <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18, fontWeight: '800' }}>
                      {item.code.toUpperCase()}
                    </Text>
                  </XStack>
                )}
              </Pressable>
            );
          })}
        </YStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        glass
        iconName="color-palette-outline"
        title={String(t('settings.theme'))}
        description={String(t('settings.theme_description'))}
      >
        <SegmentedControl
          appearance={colorScheme}
          values={themeOptions.map((item) => item === 'system' ? 'System' : String(t(`theme.${item}`)))}
          selectedIndex={Math.max(0, themeOptions.indexOf(themePreference))}
          onChange={(event) => {
            const nextTheme = themeOptions[event.nativeEvent.selectedSegmentIndex];
            if (nextTheme) {
              onThemePreferenceChange(nextTheme);
            }
          }}
          style={{
            minHeight: 34,
          }}
        />
      </SettingsPanelSection>
    </YStack>
  );
}
