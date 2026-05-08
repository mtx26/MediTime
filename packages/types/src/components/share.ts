import type { ApiResult, ApiSuccess } from '../api';
import type { CalendarItem, SharedCalendarAccess } from '../models/realtime';
import type { AppPersonalCalendars, AppSharedUserCalendars, AppTokenCalendars } from '../app';

// ─── Grouped Shared Calendar Data ────────────────────────────────────

/** A user with whom a calendar is shared (accepted or pending). */
export interface SharedCalendarUser {
  email: string;
  receiver_name: string;
  receiver_email?: string;
  receiver_photo_url: string;
  accepted: boolean;
  permission: SharedCalendarAccess;
  token: string;
}

/** A public sharing token/link for a calendar. */
export interface SharedCalendarToken {
  id: string;
  token: string;
  permission: SharedCalendarAccess;
  expires_at: string | null;
  is_revoked: boolean;
}

/** A pending registration invitation (user not yet on the platform). */
export interface SharedCalendarPendingInvite {
  token: string;
  invited_email: string;
  receiver_photo_url?: string;
}

/** Grouped data for one shared calendar as returned by fetchGroupedSharedCalendars. */
export interface GroupedSharedCalendar {
  calendar_name: string;
  users: SharedCalendarUser[];
  tokens: SharedCalendarToken[];
  invitation?: SharedCalendarPendingInvite[];
}

/** Map of calendarId → grouped shared data. */
export type GroupedSharedCalendars = Record<string, GroupedSharedCalendar>;

/** Result of fetchGroupedSharedCalendars API call. */
export type GroupedSharedCalendarsResult = ApiSuccess<{ grouped: GroupedSharedCalendars }> | { success: false };

// ─── Component Props ─────────────────────────────────────────────────

export interface CalendarCardProps {
  calendarId: string;
  data: GroupedSharedCalendar;
  personalCalendars: AppPersonalCalendars;
  tokenCalendars: AppTokenCalendars;
  sharedUserCalendars: AppSharedUserCalendars;
  onRefresh: () => void;
}

export interface TokenListProps {
  data: GroupedSharedCalendar;
  calendarId: string;
  tokenCalendars: AppTokenCalendars;
  onRefresh: () => void;
}

export interface UserListProps {
  data: GroupedSharedCalendar;
  calendarId: string;
  sharedUserCalendars: AppSharedUserCalendars;
  onRefresh: () => void;
}

export interface SharedUserRowProps {
  label: string;
  photoUrl?: string;
  status: string;
  onDelete: () => void;
}

export interface SharedCalendarPickerProps {
  calendars: CalendarItem[];
  selectedCalendarId: string | null;
  onSelectCalendar: (calendarId: string) => void;
}

export interface SharedTokenListProps {
  tokens: SharedCalendarToken[];
  onCreateToken: () => void;
  onDeleteToken: (tokenId: string) => void;
  onShareToken: (token: SharedCalendarToken) => void;
}

export interface SharedUserListProps {
  emailToInvite: string;
  invitations?: SharedCalendarPendingInvite[];
  users: SharedCalendarUser[];
  onDeleteInvitation: (token: string) => void;
  onDeleteUser: (token: string) => void;
  onEmailChange: (value: string) => void;
  onInvite: () => void;
}

export interface SharedCalendarPanelProps {
  calendarId: string;
  data: GroupedSharedCalendar;
  emailToInvite: string;
  onCreateToken: () => void;
  onDeleteInvitation: (token: string) => void;
  onDeleteToken: (tokenId: string) => void;
  onDeleteUser: (token: string) => void;
  onEmailChange: (value: string) => void;
  onInvite: () => void;
  onShareToken: (token: SharedCalendarToken) => void;
}

// ─── Accept Invite Flow ──────────────────────────────────────────────

export interface SharedInvitation {
  calendar_name: string;
  owner_photo_url: string;
  owner_display_name: string;
  owner_email: string;
}

export interface AcceptInviteSummaryProps {
  invitation: SharedInvitation;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export type SharedInvitationResult = ApiResult & {
  invitation?: SharedInvitation;
  status?: number | null;
};

export type SharedInvitationActionResult = ApiResult & {
  calendar_id?: string;
};

export interface AcceptInviteSharedUserCalendars {
  getLoginInvitation: (token: string) => Promise<SharedInvitationResult>;
  getRegistrationInvitation: (token: string) => Promise<SharedInvitationResult>;
  acceptLoginInvitation: (token: string) => Promise<SharedInvitationActionResult>;
  acceptRegistrationInvitation: (token: string) => Promise<SharedInvitationActionResult>;
  rejectLoginInvitation: (token: string) => Promise<ApiResult>;
  rejectRegistrationInvitation: (token: string) => Promise<ApiResult>;
}

export type InviteType = 'login' | 'registration';

export interface AcceptInvitePageProps {
  sharedUserCalendars: AcceptInviteSharedUserCalendars;
}
