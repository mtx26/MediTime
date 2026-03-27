// dateUtils.js

// 🔁 Formatte une date JS en YYYY-MM-DD
// param dateInput: string (ISO ou autre format reconnu par Date) ou Date
// return: string YYYY-MM-DD (ISO, sans décalage UTC)
export function toISO(dateInput: string | number | Date): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Pas de décalage UTC ici
}

// Convertit YYYY-MM-DD en date JS
// param dateInput: string YYYY-MM-DD (ISO ou autre format reconnu par Date) ou Date
// return: Date Js
export function toDate(dateInput: string | number | Date): Date {
  return new Date(dateInput);
}

// Retourne un objet Date correspondant au lundi de la semaine contenant la date donnée
// param dateInput: Date ou string (ISO ou autre format reconnu par Date)
// return: Date Js
export function getMondayDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
