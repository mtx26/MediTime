import { ActionSheetIOS, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MobilePreferencesSettingsProps } from '@meditime/types';
import type { AppThemePreference } from '../../theme/ios';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

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
  const { colorScheme, isDark } = useAppTheme();
  const themeOptions: AppThemePreference[] = ['system', 'light', 'dark'];

  const activeLanguage = languages.find((l) => language.startsWith(l.code)) ?? languages[0];

  function openLanguagePicker() {
    hapticSelection();

    if (Platform.OS === 'ios') {
      const options = languages.map((l) => `${getFlagEmoji(l.flag ?? l.code)}  ${l.label}`);
      const cancelIndex = options.length;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, String(t('cancel'))],
          cancelButtonIndex: cancelIndex,
          userInterfaceStyle: isDark ? 'dark' : 'light',
        },
        (index) => {
          if (index === cancelIndex) return;
          const picked = languages[index];
          if (picked && !language.startsWith(picked.code)) {
            hapticSelection();
            onLanguageChange(picked.code);
          }
        },
      );
    }
  }

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
        <Pressable accessibilityRole="button" onPress={openLanguagePicker}>
          {({ pressed }) => (
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                minHeight: 48,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
                opacity: pressed ? 0.7 : 1,
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
                    <Text style={{ fontSize: 20, lineHeight: 24 }}>
                      {activeLanguage ? getFlagEmoji(activeLanguage.flag ?? activeLanguage.code) : '🌐'}
                    </Text>
                  </GlassView>
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, color: ios.foreground, fontSize: 15, lineHeight: 22, fontWeight: '600' }}
                  >
                    {activeLanguage?.label ?? language}
                  </Text>
                </XStack>
                <Ionicons name="chevron-forward" size={16} color={ios.mutedForeground} />
              </XStack>
            </GlassView>
          )}
        </Pressable>
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
            const nextIndex = event.nativeEvent.selectedSegmentIndex;
            const nextTheme = themeOptions[nextIndex];
            if (nextTheme) {
              if (nextTheme !== themePreference) hapticSelection();
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
