import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlagsSelect from 'react-flags-select';
import { LANGUAGES } from '../../config/languages';
import { stripLangFromPath, localizePath, SUPPORTED_LANGS } from '../../i18n/langRoutes';
import { useLocation } from 'react-router-dom';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState('FR');
  const location = useLocation();

  useEffect(() => {
    const currentLang = LANGUAGES.find(lang => lang.code === i18n.language);
    setSelected(currentLang?.flag || 'FR');
  }, [i18n.language]);

  const onSelect = (flagCode) => {
    const lang = LANGUAGES.find(lang => lang.flag === flagCode);
    if (lang) {
      i18n.changeLanguage(lang.code);
      setSelected(lang.flag);
      if (SUPPORTED_LANGS.includes(lang.code)) {
        const path = stripLangFromPath(location.pathname);
        const target = localizePath(path, lang.code) + location.search + location.hash;
        window.location.assign(target);
      }
    }
  };

  const enabledFlags = LANGUAGES.map(lang => lang.flag);
  const customLabels = Object.fromEntries(LANGUAGES.map(lang => [lang.flag, lang.label]));

  return (
  <>
    <ReactFlagsSelect
      selected={selected}
      onSelect={onSelect}
      countries={enabledFlags}
      customLabels={customLabels}
      searchable={false}
      showSelectedLabel
      showOptionLabel
      optionsSize={14}
      selectedSize={14}
      alignOptions="right"
    />
  </>
  );
}

export default LanguageSelector;
