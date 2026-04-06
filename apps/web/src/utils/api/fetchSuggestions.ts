import { fetchSuggestionsFromSupabase } from '@meditime/utils';
import type { CalendarBoxInput, MedicineReviewSuggestion } from '@meditime/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchSuggestions = async (
  name: string,
  dose?: CalendarBoxInput['dose']
): Promise<MedicineReviewSuggestion[]> => {
  return fetchSuggestionsFromSupabase({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    name,
    dose,
    limit: 40,
  });
};
