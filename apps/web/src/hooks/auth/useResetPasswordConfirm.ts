import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useAlert } from '@/contexts/AlertContext';
import { log } from '@meditime/utils';
import { useTranslation } from 'react-i18next';

export function useResetPasswordConfirm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        showAlert('danger', t('reset_password_confirm.invalid_session'));
        return;
      }

      setSessionReady(true);
      log.info('Session rétablie avec succès', {
        origin: 'RESET_PASSWORD_CONFIRM',
        uid: session.user.id,
      });
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!sessionReady) {
      showAlert('danger', t('reset_password_confirm.cannot_change'));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      log.error("Erreur lors du changement de mot de passe", error, {
        origin: "RESET_PASSWORD_CONFIRM",
      });
      showAlert('danger', error.message);
    } else {
      showAlert('success', t('reset_password_confirm.success'));
      setTimeout(() => navigate(`/${lng}/login`), 2500);
    }

    setLoading(false);
  };

  return {
    password, setPassword,
    showPassword, setShowPassword,
    loading,
    sessionReady,
    handleSubmit,
  };
}
