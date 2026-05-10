import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';

type NativeLoadingSpinnerProps = {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function NativeLoadingSpinner({
  size = 'small',
  color,
  style,
}: NativeLoadingSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
      style={style}
    />
  );
}
