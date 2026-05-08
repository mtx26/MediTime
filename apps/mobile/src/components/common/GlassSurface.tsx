import type { ReactNode } from 'react';
import {
  Platform,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  type GlassColorScheme,
  type GlassEffectStyleConfig,
  type GlassStyle,
} from 'expo-glass-effect';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type GlassSurfaceProps = Omit<ViewProps, 'style'> & {
  borderColor?: string;
  borderWidth?: number;
  children?: ReactNode;
  colorScheme?: GlassColorScheme;
  glassEffectStyle?: GlassStyle | GlassEffectStyleConfig;
  style?: StyleProp<ViewStyle>;
  surfaceTone?: 'card' | 'subtle';
  tintColor?: string;
};

export function useGlassEffectEnabled() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable();
}

export function GlassSurface({
  borderColor,
  borderWidth = 1,
  children,
  colorScheme,
  glassEffectStyle = 'regular',
  style,
  surfaceTone = 'card',
  tintColor,
  ...props
}: GlassSurfaceProps) {
  const ios = useIosTheme();
  const { colorScheme: appColorScheme, isDark } = useAppTheme();
  const glassEnabled = useGlassEffectEnabled();
  const resolvedBorderColor = borderColor ?? (
    glassEnabled
      ? isDark
        ? 'rgba(255, 255, 255, 0.14)'
        : 'rgba(255, 255, 255, 0.42)'
      : ios.border
  );
  const fallbackBackgroundColor = surfaceTone === 'subtle'
    ? isDark
      ? 'rgba(28, 28, 30, 0.72)'
      : 'rgba(255, 255, 255, 0.8)'
    : isDark
      ? 'rgba(28, 28, 30, 0.84)'
      : 'rgba(255, 255, 255, 0.92)';
  const baseStyle: ViewStyle = {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth,
    borderColor: resolvedBorderColor,
    backgroundColor: glassEnabled ? 'transparent' : fallbackBackgroundColor,
  };

  if (glassEnabled) {
    const glassProps = tintColor ? { tintColor } : {};

    return (
      <GlassView
        {...props}
        colorScheme={colorScheme ?? appColorScheme}
        glassEffectStyle={glassEffectStyle}
        style={[baseStyle, style]}
        {...glassProps}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View {...props} style={[baseStyle, style]}>
      {children}
    </View>
  );
}
