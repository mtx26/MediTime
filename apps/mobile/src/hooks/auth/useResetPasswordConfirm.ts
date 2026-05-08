import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { log } from '@meditime/utils';
import { authService } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export function useResetPasswordConfirm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm<{ password: string }>({
    mode: 'onChange',
    defaultValues: {
      password: '',
    },
  });

  useEffect(() => {
    form.register('password', {
      validate: (value) => value.length > 0,
    });
    void form.trigger();
  }, [form]);

  const password = useWatch({ control: form.control, name: 'password' }) ?? '';

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !session?.user) {
        setError(String(t('reset_password_confirm.invalid_session')));
        setSessionReady(false);
      } else {
        setSessionReady(true);
        log.info('Session retablie avec succes', {
          origin: 'RESET_PASSWORD_CONFIRM',
          uid: session.user.id,
        });
      }

      setCheckingSession(false);
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [t]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);

    if (!sessionReady) {
      setError(String(t('reset_password_confirm.cannot_change')));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: values.password });

    if (updateError) {
      log.error('Erreur lors du changement de mot de passe', updateError, {
        origin: 'RESET_PASSWORD_CONFIRM',
      });
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    await authService.handleLogout();
    setLoading(false);
    router.replace('/(auth)/login');
  });

  return {
    password,
    setPassword: (value: string) => {
      setError(null);
      form.setValue('password', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    },
    showPassword,
    setShowPassword,
    loading,
    checkingSession,
    sessionReady,
    error,
    success,
    handleSubmit,
  };
}
