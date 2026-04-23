import SegmentedControl from '@react-native-segmented-control/segmented-control';
import type { SettingsTabBarProps } from '@meditime/types';
import { useAppTheme } from '../../theme/ios';

export function SettingsTabBar({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabBarProps<string>) {
  const { colorScheme } = useAppTheme();
  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  return (
    <SegmentedControl
      appearance={colorScheme}
      values={tabs.map((tab) => tab.label)}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        const nextTab = tabs[event.nativeEvent.selectedSegmentIndex];
        if (nextTab) {
          onTabChange(nextTab.id);
        }
      }}
      style={{
        minHeight: 34,
      }}
    />
  );
}
