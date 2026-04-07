import type { MedicineReviewSuggestion } from '@meditime/types';

interface SuggestionsUrlParams {
  supabaseUrl: string;
  name: string;
  dose?: string | number | null;
  limit?: number;
}

interface MedicamentsByCodeUrlParams {
  supabaseUrl: string;
  codeFmd: string;
}

interface SupabaseRequestBase {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface FetchSuggestionsParams extends SupabaseRequestBase {
  name: string;
  dose?: string | number | null;
  limit?: number;
}

interface FetchMedicamentsParams extends SupabaseRequestBase {
  codeFmd: string;
}

function isValidDoseFilter(dose: string | number | null | undefined): dose is string | number {
  return dose !== null && dose !== 0 && dose !== undefined && dose !== '';
}

export function buildSuggestionsUrl({ supabaseUrl, name, dose, limit = 40 }: SuggestionsUrlParams): string {
  let url = `${supabaseUrl}/rest/v1/medicaments_afmps?select=name,dose,conditionnement,forme_pharmaceutique,code_fmd`;
  url += `&name=ilike.*${encodeURIComponent(name)}*`;

  if (isValidDoseFilter(dose)) {
    url += `&dose=ilike.*${encodeURIComponent(dose)}*`;
  }

  url += '&code_fmd=not.is.null';
  url += `&limit=${limit}`;
  return url;
}

export async function fetchSuggestionsFromSupabase({
  supabaseUrl,
  supabaseAnonKey,
  name,
  dose = null,
  limit = 40,
}: FetchSuggestionsParams): Promise<MedicineReviewSuggestion[]> {
  if (!name || name.length < 2) return [];

  const url = buildSuggestionsUrl({ supabaseUrl, name, dose, limit });
  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  return res.json();
}

export function buildMedicamentsByCodeUrl({ supabaseUrl, codeFmd }: MedicamentsByCodeUrlParams): string {
  let url = `${supabaseUrl}/rest/v1/medicaments_afmps?select=name,dose,conditionnement`;
  url += `&code_fmd=ilike.*${encodeURIComponent(codeFmd)}*`;
  return url;
}

export async function fetchMedicamentsFromSupabase({
  supabaseUrl,
  supabaseAnonKey,
  codeFmd,
}: FetchMedicamentsParams): Promise<Pick<MedicineReviewSuggestion, 'name' | 'dose' | 'conditionnement'>[]> {
  if (!codeFmd) return [];

  const url = buildMedicamentsByCodeUrl({ supabaseUrl, codeFmd });
  const res = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  return res.json();
}
