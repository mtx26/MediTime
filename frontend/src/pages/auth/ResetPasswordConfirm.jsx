import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';
import { useAlert } from '../../contexts/AlertContext';
import { log } from '../../utils/logger';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordConfirm() {
  const [password, setPassword] = useState('');
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
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div className="card shadow" style={{ maxWidth: '500px', width: '100%', borderRadius: '1rem' }}>
        <div className="card-body p-4">
          <h5 className="text-center mb-3">🔐 {t('reset_password_confirm.title')}</h5>
          <p className="text-muted text-center">
            {t('reset_password_confirm.instructions')}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                {t('reset_password_confirm.new_password_label')}
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || !sessionReady}
            >
              {loading
                ? t('reset_password_confirm.saving')
                : t('reset_password_confirm.save_password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
