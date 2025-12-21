import React, { useEffect, useContext } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';

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

  const handleSendVerification = async (e) => {
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
          uid: user.id,
        });
      } catch (error) {
        log.error("Erreur d'envoi du mail de vérification", {
          uid: user.id,
          origin: 'EMAIL_VERIFICATION_ERROR',
          error,
        });
        showAlert('danger', t(`supabase-error.${error.code || 'unexpected_error'}`));
      }
    } else {
      showAlert('danger', t('verify_email.no_user'));
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const user = userInfo;
      if (user) {
        await user.reload();
        const reloadUser = getGlobalReloadUser();
        if (reloadUser) {
          reloadUser();
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div
        className="card shadow"
        style={{ maxWidth: '500px', width: '100%', borderRadius: '1rem' }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>{t('verify_email.title')}</h5>
            <p>{t('verify_email.instructions')}</p>
          </div>

          <form onSubmit={handleSendVerification}>
            <button
              type="submit"
              className="btn btn-outline-primary w-100 mt-3"
              aria-label={t('verify_email.resend_link')}
              title={t('verify_email.resend_link')}
            >
              <i className="bi bi-envelope-paper"></i>
              <span> {t('verify_email.resend_link')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
