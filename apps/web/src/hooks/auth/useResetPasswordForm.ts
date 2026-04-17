import { useState } from 'react';
import { resetPassword } from '@/services/auth/authService';
import { useAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';

export function useResetPasswordForm() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [formValid, setFormValid] = useState(true);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isFormValid =
      typeof email === 'string' && email.includes('@') && email.includes('.');
    setFormValid(isFormValid);
    if (isFormValid) {
      try {
        await resetPassword(email);
      } catch (error) {}
      showAlert('success', t('reset_password.success'));
    }
  };

  return { email, setEmail, formValid, handleReset };
}
