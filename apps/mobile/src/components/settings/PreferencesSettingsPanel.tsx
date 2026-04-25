import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
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

function getFlagEmoji(flagCode: string) {
  const normalizedCode = flagCode.toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return flagCode;
  }

  return normalizedCode
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

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
            const flag = getFlagEmoji(item.flag ?? item.code);

            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onLanguageChange(item.code)}
              >
                {({ pressed }) => (
                  <GlassView
                    colorScheme={colorScheme}
                    glassEffectStyle="clear"
                    style={{
                      minHeight: 42,
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      opacity: pressed ? 0.75 : 1,
                    }}
                  >
                    <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <XStack style={{ alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <GlassView
                          colorScheme={colorScheme}
                          glassEffectStyle="clear"
                          style={{
                            minWidth: 36,
                            minHeight: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 8,
                            borderRadius: 14,
                          }}
                        >
                          <Text style={{ color: ios.foreground, fontSize: 18, lineHeight: 22, fontWeight: '800' }}>
                            {flag}
                          </Text>
                        </GlassView>
                        <Text
                          numberOfLines={1}
                          style={{ flex: 1, color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}
                        >
                          {item.label}
                        </Text>
                      </XStack>
                      {active ? (
                        <Ionicons name="checkmark-circle-outline" size={18} color={ios.primary} />
                      ) : (
                        <Text
                          style={{
                            color: ios.mutedForeground,
                            fontSize: 12,
                            lineHeight: 18,
                            fontWeight: '800',
                          }}
                        >
                          {item.code.toUpperCase()}
                        </Text>
                      )}
                    </XStack>
                  </GlassView>
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
