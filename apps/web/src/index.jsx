import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import { AlertProvider } from './contexts/AlertContext';
import { LoadingProvider } from '@/components/ui/loading';
import { Toaster } from '@/components/ui/sonner';
import './i18n';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { initLogger } from '@meditime/utils';

// Initialize logger with API URL
initLogger(import.meta.env.VITE_API_URL, import.meta.env.DEV);

// Initialiser le thème depuis localStorage ou préférence système
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

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
  <AlertProvider>
    <UserProvider>
      <LoadingProvider>
        <div className="h-full">
          <Root />
          <SpeedInsights />
        </div>
      </LoadingProvider>
    </UserProvider>
    <Toaster position="bottom-right" closeButton />
  </AlertProvider>,
);
