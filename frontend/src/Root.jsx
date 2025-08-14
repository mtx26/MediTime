import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import App from './App';
import { useTranslation } from 'react-i18next';
import { enabledLanguageCodes, LANGUAGES } from './config/languages';

function RedirectToDefaultLang() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const defaultLang = i18n.language || LANGUAGES[0].code;
  const path = location.pathname + location.search + location.hash;
  return <Navigate to={`/${defaultLang}${path}`} replace />;
}

function Root() {
  const pathParts = window.location.pathname.split('/');
  const currentLang = pathParts[1];
  if (!enabledLanguageCodes.includes(currentLang)) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<RedirectToDefaultLang />} />
        </Routes>
      </BrowserRouter>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:lng/*" element={<App />} />
        <Route path="*" element={<RedirectToDefaultLang />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Root;
