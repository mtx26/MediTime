import React, { useState } from 'react';
import { resetPassword } from '../../services/auth/authService';
import { useAlert } from '../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';

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
    <div className="container d-flex justify-content-center align-items-center my-5">
      <div
        className="card shadow"
        style={{ maxWidth: '500px', width: '100%', borderRadius: '1rem' }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h5>{t('reset_password.title')}</h5>
            <p>{t('reset_password.instructions')}</p>
          </div>
          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">
                {t('auth.email')}
              </label>
              <input
                type="email"
                className={`form-control ${!formValid ? 'is-invalid' : ''}`}
                id="emailInput"
                aria-label={t('auth.email')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="btn btn-outline-primary w-100"
              type="submit"
              disabled={!formValid}
              aria-label={t('reset_password.send_link')}
              title={t('reset_password.send_link')}
            >
              <i className="bi bi-envelope-paper"></i>
              <span> {t('reset_password.send_link')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
