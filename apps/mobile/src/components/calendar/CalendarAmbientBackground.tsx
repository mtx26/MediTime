import { View } from 'react-native';
import { useAppTheme, useIosTheme } from '../../theme/ios';

export function CalendarAmbientBackground() {
  const ios = useIosTheme();
  const { isDark } = useAppTheme();

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 36,
          right: -54,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(10, 132, 255, 0.22)' : 'rgba(0, 122, 255, 0.18)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 220,
          left: -72,
          width: 250,
          height: 250,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(48, 209, 88, 0.14)' : 'rgba(52, 199, 89, 0.12)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 380,
          right: 40,
          width: 132,
          height: 132,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 90,
          left: 18,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255, 149, 0, 0.12)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 136,
          left: -40,
          right: -40,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.38)',
          transform: [{ rotate: '-8deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 300,
          left: -20,
          right: -20,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.28)',
          transform: [{ rotate: '10deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: 280,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 255, 255, 0.24)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: ios.background,
          opacity: isDark ? 0.72 : 0.42,
        }}
      />
    </View>
  );
}
