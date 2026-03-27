import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import type { ReactElement } from 'react';
import App from './App';
import { useTranslation } from 'react-i18next';
import { enabledLanguageCodes, DEFAULT_LANG } from '@meditime/config';

function LanguageRoutes(): ReactElement {
  const location = useLocation();
  const { i18n } = useTranslation();
  const rawLang = i18n.language || DEFAULT_LANG;
  const normalizedLang = rawLang.split('-')[0];
  const defaultLang = enabledLanguageCodes.includes(normalizedLang)
    ? normalizedLang
    : DEFAULT_LANG;
  const pathParts = location.pathname.split('/');
  const currentLang = pathParts[1] || '';

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

export default function Root(): ReactElement {
  return (
    <BrowserRouter>
      <LanguageRoutes />
    </BrowserRouter>
  );
}
