import ReactDOM from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';
import './index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import { AlertProvider } from './contexts/AlertContext';
import { LoadingProvider as LoadingProviderRaw } from '@/components/ui/loading';
import { Toaster } from '@/components/ui/sonner';
import './i18n';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { initLogger, configureApi } from '@meditime/utils';
import { DEFAULT_THEME } from '@meditime/constants';
import { getToken } from './services/supabase/tokenUtils';
import i18n from './i18n';
import { analyticsPromise } from './services/firebase/firebase';
import { logEvent } from 'firebase/analytics';

const LoadingProvider = LoadingProviderRaw as unknown as ComponentType<{ children: ReactNode }>;

initLogger(
  import.meta.env.VITE_API_URL,
  import.meta.env.DEV,
  import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true'
);

configureApi({
  getToken,
  translate: (key: string) => i18n.t(key),
  trackAnalytics: (event, data) => {
    analyticsPromise.then((analytics) => {
      if (analytics) logEvent(analytics, event, data);
    });
  },
});

const savedTheme = localStorage.getItem('theme') || DEFAULT_THEME;
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const gaId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  gtag('js', new Date());
  gtag('config', gaId);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

const root = ReactDOM.createRoot(rootElement);
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
  </AlertProvider>
);
