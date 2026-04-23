import { forwardRef, type ComponentProps, type ElementRef } from 'react';
import { Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input, YStack, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type TamaguiInputProps = ComponentProps<typeof Input>;

type PasswordInputProps = {
  autoComplete?: TextInputProps['autoComplete'];
  onSubmitEditing?: TamaguiInputProps['onSubmitEditing'];
  placeholder?: string;
  returnKeyType?: TamaguiInputProps['returnKeyType'];
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onVisibleChange: (visible: boolean) => void;
};

export const PasswordInput = forwardRef<ElementRef<typeof Input>, PasswordInputProps>(function PasswordInput({
  autoComplete,
  onSubmitEditing,
  placeholder,
  returnKeyType,
  value,
  visible,
  onChangeText,
  onVisibleChange,
}, ref) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <XStack style={{ alignItems: 'center', gap: 9 }}>
      <Ionicons name="lock-closed-outline" size={20} color={ios.mutedForeground} />
      <YStack flex={1} style={{ position: 'relative' }}>
        <Input
          ref={ref}
          size="$4"
          value={value}
          placeholder={placeholder}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={!visible}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          style={{ paddingRight: 48 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={String(t(visible ? 'auth.hide_password' : 'auth.show_password'))}
          onPress={() => onVisibleChange(!visible)}
          style={{
            position: 'absolute',
            top: 0,
            right: 2,
            bottom: 0,
            width: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {({ pressed }) => (
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={ios.mutedForeground}
              style={{ opacity: pressed ? 0.65 : 1 }}
            />
          )}
        </Pressable>
      </YStack>
    </XStack>
  );
});
