import type { DateLike } from '@meditime/types';

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

// Normalise une date à minuit (00:00:00.000) pour comparaisons fiables
export function normalizeToStartOfDay(dateInput: DateLike): Date {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Construit les 7 jours de la semaine (lundi -> dimanche) d'une date donnée
export function getWeekDates(dateInput: DateLike): Date[] {
  const monday = getMondayDate(dateInput);
  if (!monday) return [];

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    day.setHours(0, 0, 0, 0);
    return day;
  });
}
