import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import App from './App';
import { useTranslation } from 'react-i18next';
import { enabledLanguageCodes, LANGUAGES } from './config/languages';

function LanguageRoutes() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const rawLang = i18n.language || LANGUAGES[0].code;
  const normalizedLang = rawLang.split('-')[0];
  const defaultLang = enabledLanguageCodes.includes(normalizedLang)
    ? normalizedLang
    : LANGUAGES[0].code;
  const pathParts = location.pathname.split('/');
  const currentLang = pathParts[1];

  if (!enabledLanguageCodes.includes(currentLang)) {
    const path = location.pathname + location.search + location.hash;
    return <Navigate to={`/${defaultLang}${path}`} replace />;
  }

  return (
    <Routes>
      <Route path="/:lng/*" element={<App />} />
    </Routes>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <LanguageRoutes />
    </BrowserRouter>
  );
}

