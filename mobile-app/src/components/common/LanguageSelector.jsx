import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlagsSelect from 'react-flags-select';
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
