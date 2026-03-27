import { fetchMedicamentsFromSupabase } from '@meditime/utils';
import type { CalendarBoxInput } from '@meditime/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchMedicaments = async (
  code_fmd: NonNullable<CalendarBoxInput['code_fmd']>
): Promise<unknown[]> => {
  return fetchMedicamentsFromSupabase({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    codeFmd: code_fmd,
  });
};
