const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const fetchMedicaments = async (code_fmd) => {

  let url = `${SUPABASE_URL}/rest/v1/medicaments_afmps?select=name,dose,conditionnement`;
  url += `&code_fmd=ilike.*${encodeURIComponent(code_fmd)}*`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  
  const data = await res.json();


  return data;
};
