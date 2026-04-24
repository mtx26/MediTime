import { LiquidButton } from './LiquidButton';

type OutlineButtonProps = {
  label: string;
  onPress: () => void;
};

export function OutlineButton({ label, onPress }: OutlineButtonProps) {
  return <LiquidButton label={label} onPress={onPress} />;
}
