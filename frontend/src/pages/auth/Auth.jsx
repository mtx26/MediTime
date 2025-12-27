import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import {
  GoogleHandleLogin,
  registerWithEmail,
  loginWithEmail,
  GithubHandleLogin,
  TwitterHandleLogin,
  DiscordHandleLogin,
  FacebookHandleLogin,
  MicrosoftHandleLogin
} from '../../services/auth/authService';
import { useAlert } from '../../contexts/AlertContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../contexts/UserContext';
import { getValidRedirect } from '../../utils/redirect';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { SiGithub, SiDiscord, SiFacebook } from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function Auth() {
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  // 👤 Authentification utilisateur
  const [email, setEmail] = useState(''); // État pour l'adresse e-mail
  const [password, setPassword] = useState(''); // État pour le mot de passe
  const [name, setName] = useState(''); // État pour le nom d'utilisateur
  const [passwordVisible, setPasswordVisible] = useState(false); // État pour l'affichage du mot de passe
  const [activeTab, setActiveTab] = useState('login'); // État pour l'onglet actif (login/register)

  const location = useLocation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState();
  useEffect(() => {
    const last = location.pathname.split('/').pop();
    setActiveTab(last === 'register' ? 'register' : 'login');
    setRedirect(
      getValidRedirect(new URLSearchParams(location.search).get('redirect'))
    );
  }, [location.pathname, location.search]);
  
  const switchTab = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const handleLogin = async () => {
    const error = await loginWithEmail(email, password);
    if (error) {
      showAlert('danger', t(`supabase-error.${error.code || 'unexpected_error'}`));
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
      showAlert('danger', t(`supabase-error.${error.code || 'unexpected_error'}`));
      return;
    }
    log.info('Inscription réussie', {
      id: 'REGISTER-SUCCESS',
      origin: 'Auth.jsx',
      user: userInfo?.uid,
    });
    showAlert('success', t('auth.verification_sent'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'login') {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      log.error('Supabase auth error', {
        id: 'AUTH-ERROR',
        origin: 'Auth.jsx',
        stack: err.stack,
      });
    }
  };

  return (
    <div className="container mx-auto flex justify-center items-center my-10">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={switchTab} className="w-full">
            <TabsList className="mx-auto mb-4 gap-2">
              <TabsTrigger value="login">
                <LogIn className="h-4 w-4" /> {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4" /> {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <div className="text-center mb-4">
              <p>{activeTab === 'login' ? t('auth.login_with') : t('auth.register_with')}</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-2 place-items-center">
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => GoogleHandleLogin(redirect)} aria-label={t('auth.with_google')} title={t('auth.with_google')}>
                    <FcGoogle className="h-5 w-5" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.google')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => GithubHandleLogin(redirect)} aria-label={t('auth.with_github')} title={t('auth.with_github')}>
                    <SiGithub className="h-5 w-5 text-black" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.github')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => DiscordHandleLogin(redirect)} aria-label={t('auth.with_discord')} title={t('auth.with_discord')}>
                    <SiDiscord className="h-5 w-5 text-[#5865F2]" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.discord')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => TwitterHandleLogin(redirect)} aria-label={t('auth.with_twitter')} title={t('auth.with_twitter')}>
                    <FaXTwitter className="h-5 w-5 text-black" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.twitter')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => FacebookHandleLogin(redirect)} aria-label={t('auth.with_facebook')} title={t('auth.with_facebook')}>
                    <SiFacebook className="h-5 w-5 text-[#1877F2]" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.facebook')}</span>
                </div>
                <div className="flex flex-col items-center">
                  <Button variant="outline" size="icon" onClick={() => MicrosoftHandleLogin(redirect)} aria-label={t('auth.with_microsoft')} title={t('auth.with_microsoft')}>
                    <FaMicrosoft className="h-5 w-5 text-[#5E5E5E]" />
                  </Button>
                  <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.microsoft')}</span>
                </div>
              </div>
              <p className="text-center mt-3 mb-0 text-muted-foreground">{t('auth.or_with_email')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.name')}</Label>
                  <Input id="name" type="text" required value={name} autoComplete={activeTab === 'login' ? 'name' : 'new-name'} onChange={(e) => setName(e.target.value)} aria-label={t('auth.name')} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" required value={email} autoComplete={activeTab === 'login' ? 'email' : 'new-email'} onChange={(e) => setEmail(e.target.value)} aria-label={t('auth.email')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={passwordVisible ? 'text' : 'password'} required value={password} autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'} onChange={(e) => setPassword(e.target.value)} aria-label={t('auth.password')} />
                  <button type="button" className="absolute top-2.5 right-3 text-muted-foreground" aria-label={passwordVisible ? t('auth.hide_password') : t('auth.show_password')} onClick={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {activeTab === 'login' && (
                <div className="text-end">
                  <Link to={`/${lng}/reset-password`} className="no-underline hover:underline">
                    {t('auth.forgot_password')}
                  </Link>
                </div>
              )}

              {activeTab === 'register' && (
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" required aria-label={t('auth.accept_terms_aria')} />
                  <Label htmlFor="terms" className="cursor-pointer">
                    {t('auth.accept_terms')}{' '}
                    <Link to={`/${lng}/terms`} className="no-underline hover:underline">
                      {t('auth.terms_link')}
                    </Link>
                  </Label>
                </div>
              )}

              <Button type="submit" variant="outline" className="w-full shadow-sm" aria-label={activeTab === 'login' ? t('auth.login') : t('auth.register')} title={activeTab === 'login' ? t('auth.login') : t('auth.register')}>
                {activeTab === 'login' ? t('auth.login') : t('auth.register')}
              </Button>
            </form>

            <TabsContent value="login" />
            <TabsContent value="register" />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default Auth;
