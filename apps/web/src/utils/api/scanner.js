import { fetchMedicamentsFromSupabase } from '@meditime/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchMedicaments = async (code_fmd) => {
  return fetchMedicamentsFromSupabase({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    codeFmd: code_fmd,
  });
};
