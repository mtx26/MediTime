import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import './styles/bootstrap.min.css';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import i18n from './i18n';
import { getLangFromPath, localizePath, SUPPORTED_LANGS, DEFAULT_LANG } from './i18n/langRoutes';

const { pathname, search, hash } = window.location;
const langFromUrl = getLangFromPath(pathname);

if (langFromUrl) {
  if (i18n.language !== langFromUrl) {
    i18n.changeLanguage(langFromUrl);
  }
} else {
  const detected = SUPPORTED_LANGS.includes(i18n.language) ? (i18n.language) : DEFAULT_LANG;
  const target = localizePath(pathname, detected) + search + hash;
  window.location.replace(target);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);
