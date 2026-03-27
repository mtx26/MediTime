import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';
import { useAlert } from '../../contexts/AlertContext';
import { log } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordConfirm() {
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
  

  const handleSubmit = async (e) => {
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

  return (
    <div className="container mx-auto flex justify-center items-center my-10">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h5 className="text-center mb-3 text-lg font-semibold">🔐 {t('reset_password_confirm.title')}</h5>
          <p className="text-muted-foreground text-center">
            {t('reset_password_confirm.instructions')}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('reset_password_confirm.new_password_label')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={loading || !sessionReady}
            >
              <Lock className="h-4 w-4" />
              {loading
                ? t('reset_password_confirm.saving')
                : t('reset_password_confirm.save_password')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
