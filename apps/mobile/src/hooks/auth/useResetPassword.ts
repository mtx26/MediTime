import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../contexts/AuthContext';
import { buildWebResetPasswordCallbackUrl } from '../../utils';

function isValidEmail(value: string) {
  return value.includes('@') && value.includes('.');
}

export function useResetPassword() {
  const { t } = useTranslation();
  const [email, setEmailValue] = useState('');
  const [formValid, setFormValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEmail = useCallback((value: string) => {
    setEmailValue(value);
    setFormValid(true);
    setError(null);
    setSent(false);
  }, []);

  const handleReset = useCallback(async () => {
    const trimmedEmail = email.trim();
    const isFormValid = isValidEmail(trimmedEmail);

    setFormValid(isFormValid);
    setError(null);

    if (!isFormValid) {
      setError(String(t('supabase-error.invalid_email')));
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(trimmedEmail, buildWebResetPasswordCallbackUrl());
      setSent(true);
    } catch {
      setError(String(t('unexpected_error')));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, t]);

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
