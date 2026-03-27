// apiUtils.js
import { log } from '@meditime/utils';
// @ts-ignore imported from app workspace at runtime
import { getToken } from '../../../../apps/web/src/services/supabase/tokenUtils.js';
// @ts-ignore imported from app workspace at runtime
import i18n from '../../../../apps/web/src/i18n.js';
import type { ApiError, ApiResult, ApiSuccess, PerformApiCallOptions } from '@meditime/types';

interface BackendPayload {
  i18n_key?: string;
  i18nKey?: string;
  message?: string;
  error?: string;
  code?: string;
  [key: string]: unknown;
}

interface CalendarTableEntry {
  title: string;
  dose: number;
  cells: Record<string, number>;
}

interface DemoScheduleResponse {
  [key: string]: unknown;
  success: true;
  message: string;
  code: number;
  schedule: Array<Record<string, unknown>>;
  calendar_name: string;
  table: {
    morning: CalendarTableEntry[];
    noon: CalendarTableEntry[];
    evening: CalendarTableEntry[];
  };
  if_low_stock: boolean;
}

/**
 * Traduit automatiquement un message backend si une clé i18n est présente
 * @param {Object} data - Réponse du backend
 * @returns {Object} - Réponse avec message traduit
 */
function translateBackendMessage(data: BackendPayload | null | undefined): BackendPayload | null | undefined {
  if (!data) return data;
  
  // Si une clé i18n est fournie, traduire le message
  if (data.i18n_key) {
    const translated = i18n.t(data.i18n_key);
    // Si la traduction existe et est différente de la clé, l'utiliser
    if (translated !== data.i18n_key) {
      if (data.message) {
        data.message = translated;
      }
      if (data.error) {
        data.error = translated;
      }
    }
  }
  
  return data;
}

function withQuery(url: string, params: Record<string, unknown>): string {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  if (Object.keys(clean).length === 0) return url;
  const u = new URL(url, window.location.origin);
  Object.entries(clean).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function getDemoSchedule(): DemoScheduleResponse {
  return {
    success: true,
    message: 'Demo calendar loaded',
    code: 200,
    schedule: [
      {
        id: 'demo-evt-1',
        title: 'Doliprane',
        start: new Date().toISOString().split('T')[0] + 'T08:00:00',
        color: '#28a745',
        dose: 1000,
        tablet_count: 1,
        taken: false
      },
      {
        id: 'demo-evt-2',
        title: 'Vitamin C',
        start: new Date().toISOString().split('T')[0] + 'T09:00:00',
        color: '#ffc107',
        dose: 500,
        tablet_count: 1,
        taken: true
      }
    ],
    calendar_name: 'Demo Calendar',
    table: {
      morning: [
        { title: 'Doliprane', dose: 1000, cells: { Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 1, Sat: 1, Sun: 1 } },
        { title: 'Vitamin C', dose: 500, cells: { Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 1, Sat: 1, Sun: 1 } }
      ],
      noon: [],
      evening: []
    },
    if_low_stock: true,
  };
}

function handleStockDecrementMethod(method: string): MockSuccess | null {
  if (method === 'GET') return { success: true, method: 'weekly_pillbox' };
  if (method === 'PATCH') return { success: true, message: 'Demo method updated' };
  return null;
}

function handlePillbox(url: string, method: string): MockSuccess | null {
  if (url.includes('/pillbox/used')) {
    if (method === 'GET') return { success: true, used: false };
    if (method === 'POST') return { success: true, message: 'Demo pillbox used' };
  }
  if (url.includes('/pillbox/uses')) {
    if (method === 'GET') return { success: true, uses: [] };
    if (method === 'DELETE') return { success: true, message: 'Demo pillbox use cancelled' };
  }
  return null;
}

function handleBoxes(url: string, method: string): MockSuccess | null {
  if (url.includes('/restock') && method === 'POST') return { success: true, message: 'Demo box restocked' };
  if (method === 'POST') return { success: true, box_id: 'demo-new-box', message: 'Demo box created', code: 200 };
  if (method === 'PUT') return { success: true, message: 'Demo box updated' };
  if (method === 'DELETE') return { success: true, message: 'Demo box deleted' };
  return null;
}

function handleNotifications(method: string): MockSuccess | null {
  if (method === 'GET') return { success: true, enabled: true };
  if (method === 'PATCH') return { success: true, message: 'Demo notifications updated' };
  return null;
}

function handleIcs(method: string): MockSuccess | null {
  if (method === 'GET') return { success: true, tokens: [{ id: 'demo-token', token: 'https://meditime.app/ics/demo-token', created_at: new Date().toISOString() }] };
  if (method === 'POST') return { success: true, message: 'Demo ICS token created', token: { id: 'demo-token-new', token: 'https://meditime.app/ics/demo-token-new', created_at: new Date().toISOString() } };
  if (method === 'DELETE') return { success: true, message: 'Demo ICS token deleted' };
  return null;
}

// Helper function for demo mock responses
type MockSuccess = ApiSuccess;

async function handleDemoMock(url: string, method: string): Promise<MockSuccess> {
  // Helper to simulate network delay
  await new Promise(r => setTimeout(r, 100));

  if (url.includes('/schedule') && method === 'GET') return getDemoSchedule();
  if (url.includes('/stock-decrement-method')) return handleStockDecrementMethod(method) ?? { success: true, message: 'Demo action success' };
  if (url.includes('/pillbox/')) return handlePillbox(url, method) ?? { success: true, message: 'Demo action success' };
  if (url.includes('/boxes')) return handleBoxes(url, method) ?? { success: true, message: 'Demo action success' };
  if (url.includes('/notifications')) return handleNotifications(method) ?? { success: true, message: 'Demo action success' };
  if (url.includes('/ics')) return handleIcs(method) ?? { success: true, message: 'Demo action success' };

  // Default fallback for other demo requests
  return { success: true, message: 'Demo action success' };
}

export async function performApiCall({
  url,
  method = 'GET',
  headers = null,
  body = null,
  origin,            // => toujours envoyé en query
  uid = null,        // => conservé uniquement pour les logs
  analyticsEvent = null,
  analyticsData = {},
  showAlert = null,  // => fonction showAlert optionnelle pour gérer automatiquement les alertes
}: PerformApiCallOptions): Promise<ApiResult> {
  // --- MOCK DEMO START ---
  if (url?.includes('/calendars/demo')) {
    return await handleDemoMock(url, method);
  }
  // --- MOCK DEMO END ---

  try {
    const token = await getToken();
    headers = headers ?? {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Ajoute systématiquement origin en query string
    const finalUrl = withQuery(url, { origin });

    const res = await fetch(finalUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Traduire les messages d'erreur
      const translatedData = translateBackendMessage(data);
      const err = new Error(translatedData?.error || translatedData?.message || `HTTP ${res.status}`) as ApiError;
      err.code = translatedData?.code;
      err.status = res.status; // Status HTTP pour détecter les 404
      err.i18nKey = translatedData?.i18nKey || translatedData?.i18n_key;
      throw err;
    }

    // Analytics optionnels
    if (analyticsEvent) {
      const [{ analyticsPromise }, { logEvent }] = await Promise.all([
        // @ts-ignore imported from app workspace at runtime
        import('../../../../apps/web/src/services/firebase/firebase.js'),
        // @ts-ignore resolved at runtime
        import('firebase/analytics'),
      ]);
      analyticsPromise.then((analytics: unknown) => {
        if (analytics) logEvent(analytics, analyticsEvent, { ...analyticsData });
      });
    }

    // Traduire automatiquement les messages backend
    const translatedData = translateBackendMessage(data);
    
    // Logs (uid gardé tel quel, non envoyé au backend)
    log.info(translatedData?.message || 'Requête réussie', { origin, uid, ...analyticsData });

    // Afficher l'alerte de succès si showAlert est fourni
    // Uniquement pour les opérations qui modifient des données (POST, PUT, DELETE, PATCH)
    if (showAlert && translatedData?.message && method !== 'GET') {
      showAlert('success', translatedData.message);
    }

    return { success: true, ...(translatedData ?? {}) };
  } catch (err) {
    const apiError = err as ApiError;
    log.error(apiError.message || 'Erreur API', apiError, { origin, uid, ...analyticsData });
    
    // Afficher l'alerte d'erreur si showAlert est fourni (toujours, même pour GET)
    if (showAlert) {
      showAlert('danger', apiError.message);
    }
    
    return {
      success: false,
      error: apiError.message,
      code: apiError.code || null,
      status: apiError.status || null,
    };
  }
}
