import { supabase } from './supabaseClient';
import { log } from '../../utils/logger';

export async function syncSupabaseAuth(token) {
  try {
    if (!token) return;
    await supabase.auth.setSession({ access_token: token, refresh_token: token });
    supabase.realtime.setAuth(token);
  } catch (err) {
    log.error('Erreur de synchronisation de Supabase avec Firebase', err, {
      origin: 'SUPABASE_AUTH_SYNC_ERROR',
    });
  }
}

export async function clearSupabaseAuth() {
  try {
    await supabase.auth.signOut();
    supabase.realtime.setAuth(null);
  } catch (err) {
    log.error('Erreur de désynchronisation de Supabase', err, {
      origin: 'SUPABASE_AUTH_CLEAR_ERROR',
    });
  }
}
