import React, { useState, useContext } from 'react';
import { updateUserPassword } from '../../services/auth/authService';
import { UserContext } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../services/supabase/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Info } from 'lucide-react';

export default function Security() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  // 👤 Contexte utilisateur
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  // 🔒 Changement de mot de passe
  const [oldPassword, setOldPassword] = useState(''); // État pour l'ancien mot de passe
  const [newPassword, setNewPassword] = useState(''); // État pour le nouveau mot de passe
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false); // État pour l'affichage de l'ancien mot de passe
  const [newPasswordVisible, setNewPasswordVisible] = useState(false); // État pour l'affichage du nouveau mot de passe

  const isGoogleUser = userInfo?.provider === 'google';

  const reauthenticate = async () => {
    if (!userInfo || !oldPassword)
      throw new Error(t('security.current_password.required'));
    const { error } = await supabase.auth.updateUser({
      password: oldPassword,
    });
    if (error) throw new Error(error.message);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await reauthenticate();
      await updateUserPassword(newPassword);

      showAlert('success', t('security.password_updated'));

      // Réinitialiser les champs
      setNewPassword('');
      setOldPassword('');
    } catch (error) {
      showAlert('danger', error.message);
    }
  };

  if (!userInfo) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('security.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('security.instructions')}</p>
      </div>

      <div className="space-y-1">
        <h5 className="text-lg font-semibold">{t('security.current_email')}</h5>
        <p>{userInfo.email}</p>
      </div>

      {isGoogleUser ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('security.google_warning')}</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* Champ Username visible */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {t('auth.email')}
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              aria-label="Email"
              autoComplete="email"
              value={userInfo?.email || ''}
              readOnly
            />
          </div>

          {/* Ancien mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">
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
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setOldPasswordVisible(!oldPasswordVisible)}
                aria-label={oldPasswordVisible ? t('auth.hide_password') : t('auth.show_password')}
              >
                {oldPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
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
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                aria-label={newPasswordVisible ? t('auth.hide_password') : t('auth.show_password')}
              >
                {newPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="outline"
            className="mt-2"
            aria-label={t('security.update_password')}
            title={t('security.update_password')}
          >
            {t('security.update_password')}
          </Button>
        </form>
      )}
    </div>
  );
};
