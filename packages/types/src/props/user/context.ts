/* -------------------------------------------------------------------------- */
/* User Context Types                                                         */
/* -------------------------------------------------------------------------- */

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  emailEnabled: boolean;
  pushEnabled: boolean;
  uid: string;
  role?: string | null;
}

export interface UserContextValue {
  userInfo: UserInfo | null;
  recoveryEvent: boolean;
}
