import SegmentedControl from '@react-native-segmented-control/segmented-control';
import type { SettingsTabBarProps } from '@meditime/types';
import { useAppTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export function SettingsTabBar<TId extends string>({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabBarProps<string, TId>) {
  const { colorScheme } = useAppTheme();
  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab));

  return (
    <SegmentedControl
      appearance={colorScheme}
      values={tabs.map((tab) => tab.label)}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        const nextIndex = event.nativeEvent.selectedSegmentIndex;
        const nextTab = tabs[nextIndex];
        if (nextTab) {
          if (nextIndex !== selectedIndex) hapticSelection();
          onTabChange(nextTab.id);
        }
      }}
      style={{
        minHeight: 34,
      }}
    />
  );
}
