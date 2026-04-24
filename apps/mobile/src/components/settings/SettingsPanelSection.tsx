import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import type { SettingsPanelSectionProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';

export function SettingsPanelSection({
  title,
  description,
  glass = false,
  iconName,
  children,
}: SettingsPanelSectionProps<keyof typeof Ionicons.glyphMap, ReactNode>) {
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();

  const content = (
    <YStack style={{ gap: 14, padding: glass ? 6 : 0 }}>
      <YStack style={{ gap: 4 }}>
        <XStack style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name={iconName} size={20} color={ios.primary} />
          <Text style={{ flex: 1, color: ios.foreground, fontSize: 17, lineHeight: 22, fontWeight: '700' }}>
            {title}
          </Text>
        </XStack>
        {description && (
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 19 }}>
            {description}
          </Text>
        )}
      </YStack>

      {children}
    </YStack>
  );

  if (glass) {
    return (
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{
          borderRadius: 24,
          padding: 8,
        }}
      >
        {content}
      </GlassView>
    );
  }

  return (
    <YStack
      style={{
        gap: 14,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.card,
      }}
    >
      {content}
    </YStack>
  );
}
