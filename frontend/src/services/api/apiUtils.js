// apiUtils.js
import { getToken } from '../supabase/tokenUtils.js';
import { log } from '../../utils/logger';
import i18n from '../../i18n';

/**
 * Traduit automatiquement un message backend si une clé i18n est présente
 * @param {Object} data - Réponse du backend
 * @returns {Object} - Réponse avec message traduit
 */
function translateBackendMessage(data) {
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

function withQuery(url, params) {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  if (Object.keys(clean).length === 0) return url;
  const u = new URL(url, window.location.origin);
  Object.entries(clean).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

function getDemoSchedule() {
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

function handleStockDecrementMethod(method) {
  if (method === 'GET') return { success: true, method: 'weekly_pillbox' };
  if (method === 'PATCH') return { success: true, message: 'Demo method updated' };
  return null;
}

function handlePillbox(url, method) {
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

function handleBoxes(url, method) {
  if (url.includes('/restock') && method === 'POST') return { success: true, message: 'Demo box restocked' };
  if (method === 'POST') return { success: true, box_id: 'demo-new-box', message: 'Demo box created', code: 200 };
  if (method === 'PUT') return { success: true, message: 'Demo box updated' };
  if (method === 'DELETE') return { success: true, message: 'Demo box deleted' };
  return null;
}

function handleNotifications(method) {
  if (method === 'GET') return { success: true, enabled: true };
  if (method === 'PATCH') return { success: true, message: 'Demo notifications updated' };
  return null;
}

function handleIcs(method) {
  if (method === 'GET') return { success: true, tokens: [{ id: 'demo-token', token: 'https://meditime.app/ics/demo-token', created_at: new Date().toISOString() }] };
  if (method === 'POST') return { success: true, message: 'Demo ICS token created', token: { id: 'demo-token-new', token: 'https://meditime.app/ics/demo-token-new', created_at: new Date().toISOString() } };
  if (method === 'DELETE') return { success: true, message: 'Demo ICS token deleted' };
  return null;
}

// Helper function for demo mock responses
async function handleDemoMock(url, method) {
  // Helper to simulate network delay
  await new Promise(r => setTimeout(r, 100));

  if (url.includes('/schedule') && method === 'GET') return getDemoSchedule();
  if (url.includes('/stock-decrement-method')) return handleStockDecrementMethod(method);
  if (url.includes('/pillbox/')) return handlePillbox(url, method);
  if (url.includes('/boxes')) return handleBoxes(url, method);
  if (url.includes('/notifications')) return handleNotifications(method);
  if (url.includes('/ics')) return handleIcs(method);

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
}) {
  // --- MOCK DEMO START ---
  if (url?.includes('/calendars/demo')) return handleDemoMock(url, method);
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
      const err = new Error(translatedData?.error || translatedData?.message || `HTTP ${res.status}`);
      err.code = translatedData?.code;
      err.status = res.status; // Status HTTP pour détecter les 404
      err.i18nKey = translatedData?.i18nKey || translatedData?.i18n_key;
      throw err;
    }

    // Analytics optionnels
    if (analyticsEvent) {
      const [{ analyticsPromise }, { logEvent }] = await Promise.all([
        import('../firebase/firebase'),
        import('firebase/analytics'),
      ]);
      analyticsPromise.then((analytics) => {
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

    return { success: true, ...translatedData };
  } catch (err) {
    log.error(err.message || 'Erreur API', err, { origin, uid, ...analyticsData });
    
    // Afficher l'alerte d'erreur si showAlert est fourni (toujours, même pour GET)
    if (showAlert) {
      showAlert('danger', err.message);
    }
    
    return { success: false, error: err.message, code: err.code || null, status: err.status || null };
  }
}
