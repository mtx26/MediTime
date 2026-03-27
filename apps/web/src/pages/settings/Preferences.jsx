import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/common/LanguageSelector';
import ThemeToggle from '../../components/common/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Languages, Palette } from 'lucide-react';

export default function Preferences() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* En-tête */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.preferences')}</h2>
        <p className="text-muted-foreground">{t('settings.preferences_desc')}</p>
      </div>

      {/* Section Langue */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.language')}</CardTitle>
          </div>
          <CardDescription>{t('settings.language_note')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <LanguageSelector />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Thème */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.theme')}</CardTitle>
          </div>
          <CardDescription>{t('settings.theme_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-3">
              <div>
                <Label className="font-medium text-sm cursor-pointer">
                  {t('settings.theme_toggle')}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('settings.theme_help')}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
