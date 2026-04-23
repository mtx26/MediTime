import { useCallback, useMemo, type ComponentProps, type ReactNode } from 'react';
import { Input, YStack, type YStackProps } from 'tamagui';

type FormInputProps = Pick<ComponentProps<typeof Input>, 'returnKeyType' | 'onSubmitEditing'>;

export type MobileFormRenderProps = {
  disabled: boolean;
  submit: () => void;
  getInputProps: (
    returnKeyType?: FormInputProps['returnKeyType'],
  ) => FormInputProps;
};

type MobileFormProps = Omit<YStackProps, 'children'> & {
  children: ReactNode | ((form: MobileFormRenderProps) => ReactNode);
  disabled?: boolean;
  onSubmit: () => unknown;
};

export function MobileForm({
  children,
  disabled = false,
  onSubmit,
  ...stackProps
}: MobileFormProps) {
  const submit = useCallback(() => {
    if (disabled) return;
    void onSubmit();
  }, [disabled, onSubmit]);

  const form = useMemo<MobileFormRenderProps>(() => ({
    disabled,
    submit,
    getInputProps: (returnKeyType = 'done') => ({
      returnKeyType,
      onSubmitEditing: submit,
    }),
  }), [disabled, submit]);

  return (
    <YStack {...stackProps}>
      {typeof children === 'function' ? children(form) : children}
    </YStack>
  );
}
