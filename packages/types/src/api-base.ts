/* -------------------------------------------------------------------------- */
/* API Base Types                                                             */
/* -------------------------------------------------------------------------- */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}
