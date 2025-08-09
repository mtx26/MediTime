// src/pages/AuthCallback.jsx
import { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';
import { getGlobalReloadUser, UserContext } from '../../contexts/UserContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';
import { getValidRedirect } from '../../utils/redirect';

const AuthCallback = () => {
  const navigate = useNavigate();
  const reloadUser = getGlobalReloadUser();
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);

  // Pour stocker redirect et type entre les deux effets
  const redirectRef = useRef(null);
  const typeRef = useRef(null);

  const redirectMap = {
    recovery: '/reset-password-confirm',
    invite: '/reset-password-confirm',
    email_change: '/settings/account',
    reauthentication: '/settings/security',
    magiclink: '/calendars',
    signup: '/calendars',
  };

  const getRedirectPath = (type) => redirectMap[type] || '/calendars';


  // 1) Vérifie la session et lance le reloadUser
  useEffect(() => {
    const handleRedirect = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.substring(1));
      redirectRef.current = getValidRedirect(search.get('redirect'));
      typeRef.current = hash.get('type');

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
        type: typeRef.current,
        redirect: redirectRef.current,
      });
    };

    handleRedirect();
  }, [navigate, reloadUser, t]);

  // 2) Redirige quand userInfo est dispo
  useEffect(() => {
    if (!userInfo) return;

    const redirect = redirectRef.current;
    const type = typeRef.current;

    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }

    navigate(getRedirectPath(type), { replace: true });
  }, [userInfo, navigate]);

  return <p>{t('auth_callback.loading')}</p>;
};

export default AuthCallback;
