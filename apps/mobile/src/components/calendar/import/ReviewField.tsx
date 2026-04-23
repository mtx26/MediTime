import { forwardRef, type ComponentProps, type ElementRef } from 'react';
import { Text, Input, YStack } from 'tamagui';
import { useIosTheme } from '../../../theme/ios';

type TamaguiInputProps = ComponentProps<typeof Input>;

type ReviewFieldProps = {
  label: string;
  onSubmitEditing?: TamaguiInputProps['onSubmitEditing'];
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  required?: boolean;
  returnKeyType?: TamaguiInputProps['returnKeyType'];
};

export const ReviewField = forwardRef<ElementRef<typeof Input>, ReviewFieldProps>(function ReviewField({
  label,
  onSubmitEditing,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
  returnKeyType,
}, ref) {
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 7 }}>
      <Text style={{ color: ios.foreground, fontSize: 14, fontWeight: '700' }}>
        {label}{required ? <Text style={{ color: ios.destructive }}> *</Text> : null}
      </Text>
      <Input
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
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
});
