import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import './i18n';
import { SpeedInsights } from "@vercel/speed-insights/react"

// Initialize CSP dynamically
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const cspMeta = document.createElement('meta');
cspMeta.httpEquiv = 'Content-Security-Policy';
cspMeta.content = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com;
  connect-src 'self' ${apiUrl} ${supabaseUrl} wss://*.supabase.co https://*.google-analytics.com https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://vitals.vercel-insights.com ws://localhost:*;
  img-src 'self' data: https://*.google-analytics.com https://res.cloudinary.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
`.replace(/\s+/g, ' ').trim();
document.head.appendChild(cspMeta);

// Initialize Google Analytics
const gaId = import.meta.env.VITE_GA_ID;
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
