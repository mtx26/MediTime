// apiUtils.js
import { getToken } from '../supabase/tokenUtils.js';
import { log } from '../../utils/logger';

function withQuery(url, params) {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  if (Object.keys(clean).length === 0) return url;
  const u = new URL(url, window.location.origin);
  Object.entries(clean).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
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
}) {
  // --- MOCK DEMO START ---
  if (url && url.includes('/calendars/demo')) {
    // console.log('[Mock] Intercepted demo request:', method, url);
    
    // Helper to simulate network delay
    await new Promise(r => setTimeout(r, 100));

    // 1. Schedule
    if (url.includes('/schedule') && method === 'GET') {
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

    // 2. Stock Decrement Method
    if (url.includes('/stock-decrement-method')) {
        if (method === 'GET') return { success: true, method: 'weekly_pillbox' };
        if (method === 'POST') return { success: true, message: 'Demo method updated' };
    }

    // 3. Pillbox
    if (url.includes('/pillbox/used')) {
        if (method === 'GET') return { success: true, used: false };
        if (method === 'POST') return { success: true, message: 'Demo pillbox used' };
    }
    if (url.includes('/pillbox/uses')) {
        if (method === 'GET') return { success: true, uses: [] };
        if (method === 'DELETE') return { success: true, message: 'Demo pillbox use cancelled' };
    }

    // 4. Boxes
    // Check for /boxes but not /boxes/.../restock first
    if (url.includes('/boxes')) {
        if (url.includes('/restock') && method === 'POST') {
             return { success: true, message: 'Demo box restocked' };
        }
        if (method === 'POST') {
            return { success: true, box_id: 'demo-new-box', message: 'Demo box created', code: 200 };
        }
        if (method === 'PUT') {
            return { success: true, message: 'Demo box updated' };
        }
        if (method === 'DELETE') {
            return { success: true, message: 'Demo box deleted' };
        }
    }

    // 5. Notifications
    if (url.includes('/notifications')) {
        if (method === 'GET') return { success: true, enabled: true };
        if (method === 'PUT') return { success: true, message: 'Demo notifications updated' };
    }

    // 6. ICS
    if (url.includes('/ics')) {
        if (method === 'GET') return { success: true, tokens: [{ id: 'demo-token', token: 'https://meditime.app/ics/demo-token', created_at: new Date().toISOString() }] };
        if (method === 'POST') return { success: true, message: 'Demo ICS token created', token: { id: 'demo-token-new', token: 'https://meditime.app/ics/demo-token-new', created_at: new Date().toISOString() } };
        if (method === 'DELETE') return { success: true, message: 'Demo ICS token deleted' };
    }

    // Default fallback for other demo requests
    return { success: true, message: 'Demo action success' };
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
      const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
      err.code = data?.code;
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

    // Logs (uid gardé tel quel, non envoyé au backend)
    log.info(data?.message || 'Requête réussie', { origin, uid, ...analyticsData });

    return { success: true, ...data };
  } catch (err) {
    log.error(err.message || 'Erreur API', err, { origin, uid, ...analyticsData });
    return { success: false, error: err.message, code: err.code || null };
  }
}
