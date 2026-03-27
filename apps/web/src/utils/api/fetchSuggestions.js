import { fetchSuggestionsFromSupabase } from '@meditime/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchSuggestions = async (name, dose) => {
  return fetchSuggestionsFromSupabase({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    name,
    dose,
    limit: 40,
  });
};
