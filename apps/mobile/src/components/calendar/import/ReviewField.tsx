import { Text, Input, YStack } from 'tamagui';
import { ios } from '../../../theme/ios';

type ReviewFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  required?: boolean;
};

export function ReviewField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
}: ReviewFieldProps) {
  return (
    <YStack style={{ gap: 7 }}>
      <Text style={{ color: ios.foreground, fontSize: 14, fontWeight: '700' }}>
        {label}{required ? <Text style={{ color: ios.destructive }}> *</Text> : null}
      </Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          minHeight: 44,
          borderWidth: 0,
          borderRadius: 12,
          backgroundColor: ios.background,
          color: ios.foreground,
          fontSize: 16,
        }}
      />
    </YStack>
  );
}
