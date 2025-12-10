import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import './i18n';
import { SpeedInsights } from "@vercel/speed-insights/react"

// Initialize Google Analytics
const gaId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', gaId);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <Root />
    <SpeedInsights />
  </UserProvider>,
);
