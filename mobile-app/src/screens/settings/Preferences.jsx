import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/common/LanguageSelector';

export default function Preferences() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="mb-4">{t('settings.preferences')}</h2>
      <p className="text-muted mb-4">{t('settings.preferences_desc')}</p>

      <div className="mb-4">
        <label className="form-label fw-semibold">{t('settings.language')}</label>
        <LanguageSelector />
        <p className="text-muted mt-2">{t('settings.language_note')}</p>
      </div>
    </div>
  );
}
