import { useTranslation } from 'react-i18next';
import { useResetPasswordConfirm } from '@/hooks/auth/useResetPasswordConfirm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';

function ResetPasswordConfirmForm() {
  const { t } = useTranslation();
  const {
    password, setPassword,
    showPassword, setShowPassword,
    loading,
    sessionReady,
    handleSubmit,
  } = useResetPasswordConfirm();

  return (
    <>
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
    </>
  );
}

export default ResetPasswordConfirmForm;
