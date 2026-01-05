import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LANGUAGES, findLanguage } from '../../config/languages';
import { useNavigate, useLocation } from 'react-router-dom';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState('en-US');

  useEffect(() => {
    const currentLang = findLanguage(i18n.language);
    setSelected(currentLang?.locale || 'en-US');
  }, [i18n.language]);

  const onSelect = (locale) => {
    const lang = LANGUAGES.find(lang => lang.locale === locale);
    if (lang) {
      const segments = location.pathname.split('/');
      segments[1] = lang.locale;
      const newPath = segments.join('/') || '/';
      navigate(`${newPath}${location.search}${location.hash}`);
      i18n.changeLanguage(lang.locale);
      setSelected(lang.locale);
    }
  };

  const currentLang = LANGUAGES.find(lang => lang.locale === selected);
  const CurrentFlag = currentLang?.FlagComponent;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {CurrentFlag && <CurrentFlag className="w-5 h-4" />}
          <span>{currentLang?.label}</span>
          <Languages className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => {
          const FlagComponent = lang.FlagComponent;
          return (
            <DropdownMenuItem
              key={lang.locale}
              onClick={() => onSelect(lang.locale)}
              className="gap-2 cursor-pointer"
            >
              {FlagComponent && <FlagComponent className="w-5 h-4" />}
              <span className="flex-1">{lang.label}</span>
              {selected === lang.locale && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;
