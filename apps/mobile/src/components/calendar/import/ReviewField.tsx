import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { Text, YStack } from 'tamagui';
import { useIosTheme } from '../../../theme/ios';

type ReviewFieldProps = {
  label: string;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: TextInputProps['keyboardType'];
  required?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  size?: 'default' | 'sm';
  muted?: boolean;
};

export const ReviewField = forwardRef<TextInput, ReviewFieldProps>(function ReviewField({
  label,
  onSubmitEditing,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
  returnKeyType,
  size = 'default',
  muted = false,
}, ref) {
  const ios = useIosTheme();
  const isSmall = size === 'sm';

  return (
    <YStack style={{ gap: 5 }}>
      <Text style={{ color: ios.foreground, fontSize: isSmall ? 12 : 14, fontWeight: '700' }}>
        {label}{required ? <Text style={{ color: ios.destructive }}> *</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCorrect={false}
        autoCapitalize="none"
        style={{
          minHeight: isSmall ? 36 : 44,
          borderRadius: 10,
          backgroundColor: muted ? ios.accentHover : ios.card,
          color: ios.foreground,
          fontSize: isSmall ? 14 : 16,
          paddingHorizontal: isSmall ? 10 : 12,
          paddingVertical: isSmall ? 6 : 10,
        }}
      />
    </YStack>
  );
});
