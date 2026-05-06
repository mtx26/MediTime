import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { authService } from '../../contexts/AuthContext';

export function useResetPassword() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    form.register('email', {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        || String(t('supabase-error.invalid_email')),
    });
    void form.trigger();
  }, [form, t]);

  const email = useWatch({ control: form.control, name: 'email' }) ?? '';
  const formValid = !email.trim() || !form.formState.errors.email;

  const setEmail = useCallback((value: string) => {
    setError(null);
    setSent(false);
    form.setValue('email', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [form]);

  const handleReset = form.handleSubmit(async (values) => {
    const trimmedEmail = values.email.trim();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.resetPassword(trimmedEmail);
      setSent(true);
    } catch {
      setError(String(t('unexpected_error')));
    } finally {
      setIsSubmitting(false);
    }
  }, (errors) => {
    setError(errors.email?.message ?? null);
  });

  return {
    email,
    setEmail,
    formValid,
    isSubmitting,
    sent,
    error,
    handleReset,
  };
}
