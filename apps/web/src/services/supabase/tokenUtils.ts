import { supabase } from './supabaseClient';

export async function getToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (error: unknown) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}