const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchSuggestions = async (name, dose) => {
  if (!name || name.length < 2) return [];
  if (!dose) dose = null;

  let url = `${SUPABASE_URL}/rest/v1/medicaments_afmps?select=name,dose,conditionnement,forme_pharmaceutique,code_fmd`;
  url += `&name=ilike.*${encodeURIComponent(name)}*`;

  if (dose !== null && dose !== 0 && dose !== undefined && dose !== '') {
    url += `&dose=ilike.*${encodeURIComponent(dose)}*`;
  }

  // Filtrer pour ne garder que les médicaments qui ont un code_fmd car c'est les vrai medoc
  url += `&code_fmd=not.is.null`;
  url += `&limit=40`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const data = await res.json();
  return data;
};
