import SegmentedControl from '@react-native-segmented-control/segmented-control';
import type { SettingsTabBarProps } from '@meditime/types';

export function SettingsTabBar({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabBarProps<string>) {
  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  return (
    <SegmentedControl
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
