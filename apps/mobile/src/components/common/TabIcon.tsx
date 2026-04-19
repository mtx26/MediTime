import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TabIconProps as BaseTabIconProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

type IconName = ComponentProps<typeof Ionicons>['name'];
type TabIconProps = BaseTabIconProps<IconName>;

export function TabIcon({ color, focused, iconName, focusedIconName }: TabIconProps) {
  const ios = useIosTheme();

  return (
    <View style={[styles.iconShell, focused && { backgroundColor: ios.blueInfoBg }]}>
      <Ionicons name={focused ? focusedIconName : iconName} size={25} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconShell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 31,
    borderRadius: 8,
  },
});
