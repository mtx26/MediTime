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
      chromeless
      style={{
        minHeight: 34,
        alignSelf: 'flex-start',
        paddingHorizontal: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      <Text style={{ color: ios.primary, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </Button>
  );
}
