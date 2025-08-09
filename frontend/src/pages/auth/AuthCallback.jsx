// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';
import { getGlobalReloadUser } from '../../contexts/UserContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';
import { getValidRedirect } from '../../utils/redirect';

const AuthCallback = () => {
  const navigate = useNavigate();
  const reloadUser = getGlobalReloadUser();
  const { t } = useTranslation();

  useEffect(() => {
    const handleRedirect = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.substring(1));
      const redirect = getValidRedirect(search.get('redirect'));
      const type = hash.get('type');

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        log.error(t('auth_callback.session_error'), error?.message, {
          origin: 'CALLBACK_ERROR',
          uid: null,
        });
        return navigate('/login', { replace: true });
      }

      const user = session.user;
      reloadUser();

      log.info(t('auth_callback.success'), {
        origin: 'CALLBACK_SUCCESS',
        uid: user.id,
        type,
        redirect,
      });

      if (redirect) {
        return navigate(redirect, { replace: true });
      }

      switch (type) {
        case 'recovery':
        case 'invite':
          return navigate('/reset-password-confirm', { replace: true });
        case 'email_change':
          return navigate('/settings/account', { replace: true });
        case 'reauthentication':
          return navigate('/settings/security', { replace: true });
        case 'magiclink':
        case 'signup':
        default:
          return navigate('/', { replace: true });
      }
    };

    handleRedirect();
  }, [navigate, reloadUser, t]);

  return <p>{t('auth_callback.loading')}</p>;
};

export default AuthCallback;
