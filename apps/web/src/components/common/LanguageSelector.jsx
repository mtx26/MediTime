import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '../../config/languages';
import { useNavigate, useLocation } from 'react-router-dom';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState('FR');

  useEffect(() => {
    const currentLang = LANGUAGES.find(lang => lang.code === i18n.language);
    setSelected(currentLang?.flag || 'FR');
  }, [i18n.language]);

  const onSelect = (flagCode) => {
    const lang = LANGUAGES.find(lang => lang.flag === flagCode);
    if (lang) {
      const segments = location.pathname.split('/');
      segments[1] = lang.code;
      const newPath = segments.join('/') || '/';
      navigate(`${newPath}${location.search}${location.hash}`);
      i18n.changeLanguage(lang.code);
      setSelected(lang.flag);
    }
  };

  const currentLang = LANGUAGES.find(lang => lang.flag === selected);
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
              key={lang.flag}
              onClick={() => onSelect(lang.flag)}
              className="gap-2 cursor-pointer"
            >
              {FlagComponent && <FlagComponent className="w-5 h-4" />}
              <span className="flex-1">{lang.label}</span>
              {selected === lang.flag && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;
