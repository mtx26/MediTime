import { useState, useContext, useEffect } from 'react';
import { 
  updateUserPassword,
  GoogleHandleLogin,
  GithubHandleLogin,
  TwitterHandleLogin,
  FacebookHandleLogin,
  DiscordHandleLogin,
  MicrosoftHandleLogin
} from '../../services/auth/authService';
import { UserContext } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../services/supabase/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Info, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { FaGoogle, FaGithub, FaTwitter, FaFacebook, FaDiscord, FaMicrosoft } from 'react-icons/fa';
import type { SecurityProviderItem } from '@meditime/types';
import type { IconType } from 'react-icons';

export default function Security() {
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  // 👤 Contexte utilisateur
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  // 🔒 Changement de mot de passe
  const [oldPassword, setOldPassword] = useState(''); // État pour l'ancien mot de passe
  const [newPassword, setNewPassword] = useState(''); // État pour le nouveau mot de passe
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false); // État pour l'affichage de l'ancien mot de passe
  const [newPasswordVisible, setNewPasswordVisible] = useState(false); // État pour l'affichage du nouveau mot de passe
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]); // Providers liés au compte
  const [loadingProviders, setLoadingProviders] = useState(true); // État de chargement des providers
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null); // Provider en cours de connexion

  const isGoogleUser = userInfo?.provider === 'google';

  // Liste des providers disponibles dans l'app
  const availableProviders: SecurityProviderItem<IconType>[] = [
    { 
      id: 'google', 
      name: 'Google', 
      color: 'text-red-500',
      icon: FaGoogle,
      handler: GoogleHandleLogin
    },
    { 
      id: 'github', 
      name: 'GitHub', 
      color: 'text-gray-800 dark:text-gray-100',
      icon: FaGithub,
      handler: GithubHandleLogin
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      color: 'text-blue-400',
      icon: FaTwitter,
      handler: TwitterHandleLogin
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      color: 'text-blue-600',
      icon: FaFacebook,
      handler: FacebookHandleLogin
    },
    { 
      id: 'discord', 
      name: 'Discord', 
      color: 'text-indigo-500',
      icon: FaDiscord,
      handler: DiscordHandleLogin
    },
    { 
      id: 'azure', 
      name: 'Microsoft', 
      color: 'text-blue-500',
      icon: FaMicrosoft,
      handler: MicrosoftHandleLogin
    },
  ];

  // Récupérer les identités liées au compte
  useEffect(() => {
    const fetchLinkedProviders = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user?.identities) {
          const providers = user.identities.map(identity => identity.provider);
          setLinkedProviders(providers);
        }
      } catch (error) {
        console.error('Error fetching linked providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchLinkedProviders();
  }, []);

  // Connecter un nouveau provider
  const handleConnectProvider = async (provider: SecurityProviderItem<IconType>) => {
    try {
      setConnectingProvider(provider.id);
      // Construire l'URL de redirection avec la langue et la page actuelle
      const currentPath = location.pathname;
      await provider.handler(currentPath);
    } catch (error) {
      showAlert('danger', error instanceof Error ? error.message : t('security.providers.connection_error'));
      setConnectingProvider(null);
    }
  };

  const reauthenticate = async () => {
    if (!userInfo || !oldPassword)
      throw new Error(t('security.current_password.required'));
    
    // Vérifier l'ancien mot de passe en tentant une connexion
    const { error } = await supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: oldPassword,
    });
    
    if (error) throw new Error(t('security.current_password.incorrect'));
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Vérifier que le nouveau mot de passe est différent de l'ancien
      if (oldPassword === newPassword) {
        showAlert('danger', t('security.password_section.same_password_error'));
        return;
      }

      await reauthenticate();
      await updateUserPassword(newPassword);

      showAlert('success', t('security.password_updated'));

      // Réinitialiser les champs
      setNewPassword('');
      setOldPassword('');
    } catch (error) {
      showAlert('danger', error instanceof Error ? error.message : t('security.password_section.error'));
    }
  };

  if (!userInfo) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* En-tête */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('security.title')}</h2>
        <p className="text-muted-foreground">{t('security.instructions')}</p>
      </div>

      {/* Section Email et Authentification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>{t('security.email_auth.title')}</CardTitle>
          </div>
          <CardDescription>{t('security.email_auth.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email actuel */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              {t('security.current_email')}
            </Label>
            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{userInfo.email}</span>
            </div>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('security.providers.section_title')}
              </span>
            </div>
          </div>

          {/* Providers connectés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('security.providers.help_text')}
              </p>
            </div>
            
            {loadingProviders ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {t('loading')}
              </div>
            ) : (
              <div className="grid gap-3">
                {availableProviders.map((provider) => {
                  const isLinked = linkedProviders.includes(provider.id);
                  const ProviderIcon = provider.icon;
                  const isConnecting = connectingProvider === provider.id;
                  
                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border">
                          <ProviderIcon className={`h-4 w-4 ${provider.color}`} />
                        </div>
                        <span className="font-medium text-sm">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isLinked ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              {t('security.providers.connected')}
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnectProvider(provider)}
                            disabled={isConnecting}
                            className="h-8 text-xs"
                          >
                            {isConnecting ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                {t('security.providers.connecting')}
                              </span>
                            ) : (
                              t('security.providers.connect')
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Mot de passe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle>{t('security.password_section.title')}</CardTitle>
          </div>
          <CardDescription>{t('security.password_section.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleUser ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t('security.google_warning')}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Ancien mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-sm font-medium">
                  {t('security.current_password.label')}
                </Label>
                <div className="relative">
                  <Input
                    type={oldPasswordVisible ? 'text' : 'password'}
                    id="oldPassword"
                    name="current-password"
                    aria-label={t('security.current_password.label')}
                    autoComplete="current-password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t('security.current_password.placeholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
                    aria-label={oldPasswordVisible ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {oldPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  {t('reset_password_confirm.new_password_label')}
                </Label>
                <div className="relative">
                  <Input
                    type={newPasswordVisible ? 'text' : 'password'}
                    id="newPassword"
                    name="new-password"
                    aria-label={t('reset_password_confirm.new_password_label')}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('security.new_password.placeholder')}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    aria-label={newPasswordVisible ? t('auth.hide_password') : t('auth.show_password')}
                  >
                    {newPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('security.password_section.hint')}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                aria-label={t('security.update_password')}
                title={t('security.update_password')}
              >
                {t('security.update_password')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
