import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import type { AuthModeToggleProps } from '@meditime/types';
import { useAppTheme } from '../../theme/ios';

const modeKeys = ['auth.login', 'auth.register'] as const;

export function AuthModeToggle({ activeMode, onModeChange }: AuthModeToggleProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const selectedIndex = activeMode === 'register' ? 1 : 0;

  return (
    <YStack style={{ alignSelf: 'center', width: '100%' }}>
      <SegmentedControl
        values={modeKeys.map((key) => String(t(key)))}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          const nextIndex = event.nativeEvent.selectedSegmentIndex;
          onModeChange(nextIndex === 1 ? 'register' : 'login');
        }}
        appearance={colorScheme}
      />
    </YStack>
  );
}
