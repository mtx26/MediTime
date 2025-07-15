import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../services/supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import AlertSystem from '../../components/common/AlertSystem';
import { log } from '../../utils/logger';
import { getSupabaseErrorMessage } from '../../utils/supabase/SupabaseErrorMessage';
import { useTranslation } from 'react-i18next';

function VerifyEmail() {
  // 🔐 Contexte utilisateur
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();

  // ⚠️ Alertes
  const [alertMessage, setAlertMessage] = useState(null); // Message d'alerte
  const [alertType, setAlertType] = useState('info'); // Type d'alerte (par défaut : info)

  // 📍 Navigation
  const navigate = useNavigate(); // Hook de navigation

  useEffect(() => {
    if (userInfo?.emailVerified) {
      log.info('Email vérifié via UserContext, redirection...', {
        id: 'EMAIL_VERIFIED',
        origin: 'VerifyEmail.jsx',
        userInfo,
      });
      navigate('/calendars');
    }
  }, [userInfo, navigate]); // ✅ Si userInfo.emailVerified change, on redirige

  const handleSendVerification = async (e) => {
    e.preventDefault();

    const user = userInfo;

    if (user) {
      try {
        await supabase.auth.sendEmailVerification({
          options: {
            redirectTo: window.location.origin + '/auth/callback',
          },
        });
        setAlertMessage(t('auth.verification_sent'));
        setAlertType('success');
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
        setAlertMessage('❌ ' + getSupabaseErrorMessage(error.code));
        setAlertType('danger');
      }
    } else {
      setAlertMessage(t('verify_email.no_user'));
      setAlertType('danger');
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

          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />

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
