import { useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { UserContext, getGlobalReloadUser } from '@/contexts/UserContext';
import type { UserContextValue } from '@meditime/types';
import { useAlert } from '@/contexts/AlertContext';
import { log } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

function VerifyEmailForm() {
  const userContext = useContext(UserContext) as UserContextValue | null;
  const userInfo = userContext?.userInfo ?? null;
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { lng } = useParams();
  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;

  useEffect(() => {
    if (userInfo?.emailVerified) {
      log.info('Email vérifié via UserContext, redirection...', {
        id: 'EMAIL_VERIFIED',
        origin: 'VerifyEmail.jsx',
        userInfo,
      });
      navigate(`/${lng}/calendars`);
    }
  }, [userInfo, navigate, lng]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (userInfoRef.current) {
        const reloadUser = getGlobalReloadUser();
        if (reloadUser) {
          reloadUser();
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSendVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = userInfoRef.current;

    if (user) {
      try {
        await supabase.auth.resend({
          type: 'signup',
          email: user.email!,
          options: {
            emailRedirectTo: `${window.location.origin}/${lng}/auth/callback`,
          },
        });
        showAlert('success', t('auth.verification_sent'));
        log.info('Email de vérification envoyé', {
          code: 'EMAIL_VERIFICATION_SENT',
          origin: 'VerifyEmail',
          uid: user.uid,
        });
      } catch (error: unknown) {
        log.error("Erreur d'envoi du mail de vérification", {
          uid: user.uid,
          origin: 'EMAIL_VERIFICATION_ERROR',
          error,
        });
        showAlert('danger', t(`supabase-error.${(error as { code?: string }).code || 'unexpected_error'}`));
      }
    } else {
      showAlert('danger', t('verify_email.no_user'));
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <h5 className="text-lg font-semibold">{t('verify_email.title')}</h5>
        <p className="text-muted-foreground">{t('verify_email.instructions')}</p>
      </div>
      <form onSubmit={handleSendVerification}>
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2 mt-3"
          aria-label={t('verify_email.resend_link')}
          title={t('verify_email.resend_link')}
        >
          <Mail className="h-4 w-4" />
          {t('verify_email.resend_link')}
        </Button>
      </form>
    </>
  );
}

export default VerifyEmailForm;
