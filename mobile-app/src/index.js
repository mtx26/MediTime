import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import Root from './Root';
import { UserProvider } from './contexts/UserContext';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <Root />
  </UserProvider>,
);
