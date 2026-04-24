import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TabIconProps as BaseTabIconProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type IconName = ComponentProps<typeof Ionicons>['name'];
type TabIconProps = BaseTabIconProps<IconName>;

export function TabIcon({ color, focused, iconName, focusedIconName }: TabIconProps) {
  const ios = useIosTheme();
  const { isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.iconShell,
        focused && {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.36)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.44)',
        },
      ]}
    >
      <Ionicons name={focused ? focusedIconName : iconName} size={25} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconShell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 28,
    borderRadius: 8,
  },
});
