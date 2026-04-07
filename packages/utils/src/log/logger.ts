const forceLog = false;

let isDev = false;
let API_URL: string | null = null;
let enableRemoteLogging = false;

export const initLogger = (
  apiUrl: string | null,
  isDevMode = false,
  remoteLoggingEnabled = false
): void => {
  API_URL = apiUrl;
  isDev = isDevMode;
  enableRemoteLogging = remoteLoggingEnabled;

  if (!API_URL) console.warn('Logger: API_URL not provided');
};

type LogType = 'info' | 'warning' | 'error';

const fetchLog = (
  msg: string,
  error: unknown,
  context: Record<string, unknown> | null | undefined,
  type: LogType
): void => {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
  const stack = error instanceof Error ? error.stack ?? null : null;

  const structuredMessage = {
    message: msg,
    context: context ?? null,
    error: message,
    stack,
    type,
  };

  if (!API_URL) return;
  if (!(forceLog || enableRemoteLogging)) return;

  fetch(`${API_URL}/api/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(structuredMessage),
  }).catch((err) => {
    if (isDev) console.warn("Échec de l'envoi du log au backend :", err);
  });
};

export const log = {
  info: (msg: string, context?: Record<string, unknown>) => fetchLog(msg, null, context, 'info'),
  warn: (msg: string, context?: Record<string, unknown>) => fetchLog(msg, null, context, 'warning'),
  error: (msg: string, error: unknown, context?: Record<string, unknown>) => fetchLog(msg, error, context, 'error'),
};
