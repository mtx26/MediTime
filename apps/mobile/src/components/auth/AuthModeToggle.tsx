import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import type { AuthMode, AuthModeToggleProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

const modes: { id: AuthMode; iconName: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { id: 'login', iconName: 'log-in-outline', labelKey: 'auth.login' },
  { id: 'register', iconName: 'person-add-outline', labelKey: 'auth.register' },
];

export function AuthModeToggle({ activeMode, onModeChange }: AuthModeToggleProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <XStack
      style={{
        alignSelf: 'center',
        gap: 6,
        padding: 4,
        borderRadius: 8,
        backgroundColor: ios.accentHover,
      }}
    >
      {modes.map((mode) => {
        const active = activeMode === mode.id;

        return (
          <Pressable
            key={mode.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onModeChange(mode.id)}
          >
            {({ pressed }) => (
              <XStack
                style={{
                  alignItems: 'center',
                  gap: 7,
                  minHeight: 38,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: active ? ios.card : 'transparent',
                  opacity: pressed ? 0.75 : 1,
                }}
              >
                <Ionicons name={mode.iconName} size={18} color={active ? ios.primary : ios.mutedForeground} />
                <Text
                  style={{
                    color: active ? ios.foreground : ios.mutedForeground,
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '800',
                  }}
                >
                  {t(mode.labelKey)}
                </Text>
              </XStack>
            )}
          </Pressable>
        );
      })}
    </XStack>
  );
}
