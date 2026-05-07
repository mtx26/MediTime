import { Text } from 'tamagui';
import type { CalendarHeaderTitleProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function CalendarHeaderTitle({ title }: CalendarHeaderTitleProps) {
  const ios = useIosTheme();

  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{
        maxWidth: 180,
        color: ios.foreground,
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
  );
}
