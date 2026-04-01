import type { ApiResult } from '../../../contracts';

export interface SharedInvitation {
  calendar_name: string;
  owner_photo_url: string;
  owner_display_name: string;
  owner_email: string;
}

export type SharedInvitationResult = ApiResult & {
  invitation?: SharedInvitation;
  status?: number;
};

export type SharedInvitationActionResult = ApiResult & {
  calendar_id?: string | number;
};

export interface AcceptInviteSharedUserCalendars {
  getLoginInvitation: (token: string) => Promise<SharedInvitationResult>;
  getRegistrationInvitation: (token: string) => Promise<SharedInvitationResult>;
  acceptLoginInvitation: (token: string) => Promise<SharedInvitationActionResult>;
  acceptRegistrationInvitation: (token: string) => Promise<SharedInvitationActionResult>;
  rejectLoginInvitation: (token: string) => Promise<ApiResult>;
  rejectRegistrationInvitation: (token: string) => Promise<ApiResult>;
}

export interface AcceptInvitePageProps {
  sharedUserCalendars: AcceptInviteSharedUserCalendars | Record<string, unknown>;
}
