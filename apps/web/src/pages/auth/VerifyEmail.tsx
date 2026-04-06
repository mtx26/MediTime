import { useEffect, useContext } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { log } from '@meditime/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

function VerifyEmail() {
  // 🔐 Contexte utilisateur
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  // 📍 Navigation
  const navigate = useNavigate(); // Hook de navigation
  const { lng } = useParams();

  useEffect(() => {
    if (userInfo?.emailVerified) {
      log.info('Email vérifié via UserContext, redirection...', {
        id: 'EMAIL_VERIFIED',
        origin: 'VerifyEmail.jsx',
        userInfo,
      });
      navigate(`/${lng}/calendars`);
    }
  }, [userInfo, navigate]); // ✅ Si userInfo.emailVerified change, on redirige

  const handleSendVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = userInfo;

    if (user) {
      try {
        await supabase.auth.sendEmailVerification({
          options: {
            redirectTo: `${window.location.origin}/${lng}/auth/callback`,
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

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const user = userInfo;
      if (user) {
        const reloadUser = getGlobalReloadUser();
        if (reloadUser) {
          reloadUser();
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container mx-auto flex justify-center items-center my-10">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
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
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
