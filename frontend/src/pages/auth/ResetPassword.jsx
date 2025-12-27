import React, { useState } from 'react';
import { resetPassword } from '../../services/auth/authService';
import { useAlert } from '../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

function ResetPassword() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState(''); // État pour l'adresse e-mail
  const [formValid, setFormValid] = useState(true);

  // 🔄 Réinitialisation du mot de passe
  const handleReset = async (e) => {
    e.preventDefault();
    const isFormValid =
      typeof email === 'string' && email.includes('@') && email.includes('.');
    setFormValid(isFormValid);
    if (isFormValid) {
      try {
        await resetPassword(email);
      } catch (error) {}
      showAlert('success', t('reset_password.success'));
    }
  };

  return (
    <div className="container mx-auto flex justify-center items-center my-10">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="text-center mb-4">
            <h5 className="text-lg font-semibold">{t('reset_password.title')}</h5>
            <p className="text-muted-foreground">{t('reset_password.instructions')}</p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailInput">{t('auth.email')}</Label>
              <Input
                id="emailInput"
                type="email"
                aria-label={t('auth.email')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={!formValid ? 'border-destructive focus-visible:ring-destructive/50' : ''}
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2"
              disabled={!formValid}
              aria-label={t('reset_password.send_link')}
              title={t('reset_password.send_link')}
            >
              <Mail className="h-4 w-4" />
              {t('reset_password.send_link')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
