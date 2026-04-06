/* -------------------------------------------------------------------------- */
/* Common Models — types de base réutilisés dans toute l'application          */
/* -------------------------------------------------------------------------- */

/** Profil utilisateur minimal (photo, nom, email). */
export interface UserProfile {
  photo_url: string;
  display_name: string;
  email?: string | null;
}

/** Info minimale d'un calendrier. */
export interface CalendarInfo {
  id: string;
  name: string;
  owner_email?: string;
  owner_name?: string;
  owner_photo_url?: string;
}

/** Calendrier enrichi pour affichage en liste. */
export interface CalendarListItem extends CalendarInfo {
  boxes_count?: number;
  ifLowStock?: boolean;
}
