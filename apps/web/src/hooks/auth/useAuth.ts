import { useState, useEffect, useContext } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { registerWithEmail, loginWithEmail } from '@/services/auth/authService';
import { useAlert } from '@/contexts/AlertContext';
import { log, getValidRedirect } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { UserContext } from '@/contexts/UserContext';

export function useAuth() {
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const location = useLocation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState<string | undefined>();

  useEffect(() => {
    const last = location.pathname.split('/').pop();
    setActiveTab(last === 'register' ? 'register' : 'login');
    setRedirect(
      getValidRedirect(new URLSearchParams(location.search).get('redirect')) ?? undefined
    );
  }, [location.pathname, location.search]);

  const switchTab = (tab: string) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const handleLogin = async () => {
    const error = await loginWithEmail(email, password);
    if (error) {
      const errorCode = (error as { code?: string }).code || 'unexpected_error';
      showAlert('danger', t(`supabase-error.${errorCode}`));
      return;
    }
    log.info('Connexion réussie', {
      id: 'LOGIN-SUCCESS',
      origin: 'Auth.jsx',
      user: userInfo?.uid,
    });
    const callbackUrl =
      `/${lng}/auth/callback` +
      (redirect ? `?redirect=${encodeURIComponent(redirect)}` : '');
    navigate(callbackUrl, { replace: true });
  };

  const handleRegister = async () => {
    const error = await registerWithEmail(email, password, name, redirect);
    if (error) {
      const errorCode = (error as { code?: string }).code || 'unexpected_error';
      showAlert('danger', t(`supabase-error.${errorCode}`));
      return;
    }
    log.info('Inscription réussie', {
      id: 'REGISTER-SUCCESS',
      origin: 'Auth.jsx',
      user: userInfo?.uid,
    });
    showAlert('success', t('auth.verification_sent'));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (activeTab === 'login') {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err: unknown) {
      log.error('Supabase auth error', {
        id: 'AUTH-ERROR',
        origin: 'Auth.jsx',
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    name, setName,
    passwordVisible, setPasswordVisible,
    activeTab, switchTab,
    redirect,
    lng,
    handleSubmit,
  };
}
