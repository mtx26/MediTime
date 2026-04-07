// ─── Common Models ───────────────────────────────────────────────────

export interface UserProfile {
  photo_url: string;
  display_name: string;
  email?: string | null;
}

export interface CalendarInfo {
  id: string;
  name: string;
  owner_email?: string;
  owner_name?: string;
  owner_photo_url?: string;
}

export interface CalendarListItem extends CalendarInfo {
  boxes_count?: number;
  ifLowStock?: boolean;
}
