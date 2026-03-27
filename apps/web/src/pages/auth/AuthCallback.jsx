// src/pages/AuthCallback.jsx
import { useEffect, useContext, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';
import { getGlobalReloadUser, UserContext } from '../../contexts/UserContext';
import { log } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { getValidRedirect } from '@meditime/utils';
import { useLoading } from '@/components/ui/loading';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { lng } = useParams();
  const { t } = useTranslation();
  const { userInfo, recoveryEvent } = useContext(UserContext);
  const reloadUser = getGlobalReloadUser();
  const { showLoading } = useLoading();

  // Pour stocker redirect et type
  const redirectRef = useRef(null);
  const typeRef = useRef(null);
  const [isUrlProcessed, setIsUrlProcessed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const redirectMap = new Map([
    ['recovery', '/reset-password-confirm'],
    ['invite', '/reset-password-confirm'],
    ['email_change', '/settings/account'],
    ['reauthentication', '/settings/security'],
    ['magiclink', '/calendars'],
    ['signup', '/calendars'],
  ]);

  const getRedirectPath = (rawType) =>
    redirectMap.get(String(rawType)) || '/calendars';


  // 1) Vérifie la session et lance le reloadUser
  useEffect(() => {
    const handleRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const redirectParam = searchParams.get('redirect');
      const typeParam = hashParams.get('type') || searchParams.get('type');

      redirectRef.current = getValidRedirect(redirectParam);
      typeRef.current = typeParam;

      // Si l'événement de récupération a été détecté globalement
      if (recoveryEvent) {
        typeRef.current = 'recovery';
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        log.error(t('auth_callback.session_error'), error?.message, {
          origin: 'CALLBACK_ERROR',
          uid: null,
        });
        setIsLoading(false);
        return navigate(`/${lng}/login`, { replace: true });
      }

      const user = session.user;
      reloadUser(session);

      log.info(t('auth_callback.success'), {
        origin: 'CALLBACK_SUCCESS',
        uid: user.id,
        type: typeRef.current,
        redirect: redirectRef.current,
      });
      
      setIsUrlProcessed(true);
    };

    handleRedirect();
  }, [navigate, reloadUser, t, recoveryEvent]);

  // 2) Redirige quand userInfo est dispo
  useEffect(() => {
    if (!userInfo || !isUrlProcessed) return;

    const redirect = redirectRef.current;
    const type = typeRef.current;

    if (redirect) {
      if (redirect.startsWith('/')) {
        const cleaned = redirect.replace(/^\/[a-z]{2}(?=\/|$)/, '');
        showLoading(false);
        navigate(`/${lng}${cleaned}`, { replace: true });
      } else {
        showLoading(false);
        navigate(redirect, { replace: true });
      }
      return;
    }
    showLoading(false);
    navigate(`/${lng}${getRedirectPath(type)}`, { replace: true });
  }, [userInfo, isUrlProcessed, navigate, lng, showLoading]);

  useEffect(() => {
    showLoading(isLoading, t('auth_callback.loading'));
  }, [isLoading, showLoading, t]);
};

export default AuthCallback;
