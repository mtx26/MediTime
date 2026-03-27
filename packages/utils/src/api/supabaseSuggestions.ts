function isValidDoseFilter(dose) {
  return dose !== null && dose !== 0 && dose !== undefined && dose !== '';
}

export function buildSuggestionsUrl({ supabaseUrl, name, dose, limit = 40 }) {
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
}) {
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

export function buildMedicamentsByCodeUrl({ supabaseUrl, codeFmd }) {
  let url = `${supabaseUrl}/rest/v1/medicaments_afmps?select=name,dose,conditionnement`;
  url += `&code_fmd=ilike.*${encodeURIComponent(codeFmd)}*`;
  return url;
}

export async function fetchMedicamentsFromSupabase({
  supabaseUrl,
  supabaseAnonKey,
  codeFmd,
}) {
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
