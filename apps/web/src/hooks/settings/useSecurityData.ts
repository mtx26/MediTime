import { useState, useContext, useEffect } from 'react';
import {
  updateUserPassword,
  GoogleHandleLogin,
  GithubHandleLogin,
  TwitterHandleLogin,
  FacebookHandleLogin,
  DiscordHandleLogin,
  MicrosoftHandleLogin,
} from '@/services/auth/authService';
import { UserContext } from '@/contexts/UserContext';
import { useAlert } from '@/contexts/AlertContext';
import { supabase } from '@/services/supabase/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { FaGoogle, FaGithub, FaTwitter, FaFacebook, FaDiscord, FaMicrosoft } from 'react-icons/fa';
import type { SecurityProviderItem } from '@meditime/types';
import type { IconType } from 'react-icons';

export function useSecurityData() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const location = useLocation();
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const isGoogleUser = userInfo?.provider === 'google';

  const wrap = (fn: (redirect?: string) => Promise<void>) =>
    (redirect?: string | null) => fn(redirect ?? undefined);

  const availableProviders: SecurityProviderItem<IconType>[] = [
    { id: 'google', name: 'Google', color: 'text-red-500', icon: FaGoogle, handler: wrap(GoogleHandleLogin) },
    { id: 'github', name: 'GitHub', color: 'text-gray-800 dark:text-gray-100', icon: FaGithub, handler: wrap(GithubHandleLogin) },
    { id: 'twitter', name: 'Twitter', color: 'text-blue-400', icon: FaTwitter, handler: wrap(TwitterHandleLogin) },
    { id: 'facebook', name: 'Facebook', color: 'text-blue-600', icon: FaFacebook, handler: wrap(FacebookHandleLogin) },
    { id: 'discord', name: 'Discord', color: 'text-indigo-500', icon: FaDiscord, handler: wrap(DiscordHandleLogin) },
    { id: 'azure', name: 'Microsoft', color: 'text-blue-500', icon: FaMicrosoft, handler: wrap(MicrosoftHandleLogin) },
  ];

  useEffect(() => {
    const fetchLinkedProviders = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user?.identities) {
          setLinkedProviders(user.identities.map(identity => identity.provider));
        }
      } catch (error) {
        console.error('Error fetching linked providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchLinkedProviders();
  }, []);

  const handleConnectProvider = async (provider: SecurityProviderItem<IconType>) => {
    try {
      setConnectingProvider(provider.id);
      await provider.handler(location.pathname);
    } catch (error) {
      showAlert('danger', error instanceof Error ? error.message : t('security.providers.connection_error'));
      setConnectingProvider(null);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (oldPassword === newPassword) {
        showAlert('danger', t('security.password_section.same_password_error'));
        return;
      }

      // Reauthenticate
      if (!userInfo?.email || !oldPassword) throw new Error(t('security.current_password.required'));
      const { error } = await supabase.auth.signInWithPassword({
        email: userInfo.email,
        password: oldPassword,
      });
      if (error) throw new Error(t('security.current_password.incorrect'));

      await updateUserPassword(newPassword);
      showAlert('success', t('security.password_updated'));
      setNewPassword('');
      setOldPassword('');
    } catch (error) {
      showAlert('danger', error instanceof Error ? error.message : t('security.password_section.error'));
    }
  };

  return {
    t, userInfo, isGoogleUser,
    oldPassword, setOldPassword, newPassword, setNewPassword,
    oldPasswordVisible, setOldPasswordVisible, newPasswordVisible, setNewPasswordVisible,
    linkedProviders, loadingProviders, connectingProvider,
    availableProviders, handleConnectProvider, handleUpdatePassword,
  };
}
