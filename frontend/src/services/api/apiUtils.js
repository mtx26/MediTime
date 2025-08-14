// apiUtils.js
import { getToken } from '../supabase/tokenUtils.js';
import { analyticsPromise } from '../firebase/firebase';
import { log } from '../../utils/logger';
import { logEvent } from 'firebase/analytics';

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
