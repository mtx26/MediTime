import Constants from 'expo-constants';

const isDev = __DEV__;
const forceLog = true;
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

if (!API_URL) console.error('API_URL is not defined');

const fetchLog = (msg, error, context, type) => {
  const structuredMessage = {
    message: msg,
    context: context ?? null,
    error: error?.message ?? (typeof error === 'string' ? error : null),
    stack: error?.stack ?? null,
    type,
  };

  // Console log pour debug
  if (isDev) {
    console.log(`[${type.toUpperCase()}] ${msg}`, context, error);
  }

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
