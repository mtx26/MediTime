import { Button, Text } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type OutlineButtonProps = {
  label: string;
  onPress: () => void;
};

export function OutlineButton({ label, onPress }: OutlineButtonProps) {
  const ios = useIosTheme();

  return (
    <Button
      size="$3"
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: ios.blueInfoBg,
      }}
    >
      <Text style={{ color: ios.primary, fontWeight: '700' }}>{label}</Text>
    </Button>
  );
}
