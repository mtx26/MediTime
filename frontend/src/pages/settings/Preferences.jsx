import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/common/LanguageSelector';
import ThemeToggle from '../../components/common/ThemeToggle';
import { Label } from '@/components/ui/label';

export default function Preferences() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('settings.preferences')}</h2>
        <p className="text-muted-foreground mt-1">{t('settings.preferences_desc')}</p>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">{t('settings.language')}</Label>
        <LanguageSelector />
        <p className="text-muted-foreground text-sm">{t('settings.language_note')}</p>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">{t('settings.theme')}</Label>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">{t('settings.theme_toggle')}</span>
        </div>
      </div>
    </div>
  );
}
