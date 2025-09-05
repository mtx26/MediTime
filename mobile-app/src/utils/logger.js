import { API_URL } from '@env';

const isDev = __DEV__;
const forceLog = true; // ← reste utile en local

if (!API_URL) console.error('API_URL is not defined');

const fetchLog = (msg, error, context, type) => {
  const structuredMessage = {
    message: msg,
    context: context ?? null,
    error: error?.message ?? (typeof error === 'string' ? error : null),
    stack: error?.stack ?? null,
    type,
  };

  if ((forceLog || !isDev) && API_URL) {
    fetch(`${API_URL}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structuredMessage),
    }).catch((err) => {
      if (isDev) console.warn("Échec de l'envoi du log au backend :", err);
    });
  }
};

export const log = {
  info: (msg, context) => fetchLog(msg, null, context, 'info'),
  warn: (msg, context) => fetchLog(msg, null, context, 'warning'),
  error: (msg, error, context) => fetchLog(msg, error, context, 'error'),
};
