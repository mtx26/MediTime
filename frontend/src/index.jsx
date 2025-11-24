import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import './i18n';
import { SpeedInsights } from "@vercel/speed-insights/react"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <Root />
    <SpeedInsights />
  </UserProvider>,
);
