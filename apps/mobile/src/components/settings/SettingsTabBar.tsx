import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import type { SettingsTabBarProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function SettingsTabBar({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabBarProps<keyof typeof Ionicons.glyphMap>) {
  const ios = useIosTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack style={{ gap: 8, paddingVertical: 2 }}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onTabChange(tab.id)}
            >
              {({ pressed }) => (
                <XStack
                  style={{
                    alignItems: 'center',
                    gap: 7,
                    minHeight: 42,
                    paddingHorizontal: 13,
                    borderRadius: 10,
                    backgroundColor: active ? ios.blueInfoBg : ios.card,
                    borderWidth: 1,
                    borderColor: active ? ios.blueInfoBorder : ios.border,
                    opacity: pressed ? 0.78 : 1,
                  }}
                >
                  <Ionicons
                    name={tab.iconName}
                    size={17}
                    color={active ? ios.primary : ios.mutedForeground}
                  />
                  <Text
                    style={{
                      color: active ? ios.primary : ios.foreground,
                      fontSize: 13,
                      lineHeight: 18,
                      fontWeight: '800',
                    }}
                  >
                    {tab.label}
                  </Text>
                </XStack>
              )}
            </Pressable>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
