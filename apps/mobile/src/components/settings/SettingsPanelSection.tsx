import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import type { SettingsPanelSectionProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function SettingsPanelSection({
  title,
  description,
  iconName,
  children,
}: SettingsPanelSectionProps<keyof typeof Ionicons.glyphMap, ReactNode>) {
  const ios = useIosTheme();

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
}
