/* -------------------------------------------------------------------------- */
/* API Utility Types                                                          */
/* -------------------------------------------------------------------------- */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AlertLevel = 'success' | 'danger' | 'warning' | 'info';

export type ShowAlert = (level: AlertLevel, message: string) => void;

export interface ApiError extends Error {
  code?: string | null;
  status?: number | null;
  i18nKey?: string;
}

export interface ApiFailure {
  success: false;
  error: string;
  code: string | null;
  status: number | null;
}

export type ApiSuccess = { success: true } & Record<string, unknown>;

export type ApiResult = ApiSuccess | ApiFailure;

export interface PerformApiCallOptions {
  url: string;
  method?: HttpMethod;
  headers?: HeadersInit | null;
  body?: unknown | null;
  origin: string;
  uid?: string | null;
  analyticsEvent?: string | null;
  analyticsData?: Record<string, unknown>;
  showAlert?: ShowAlert | null;
}

export type PerformApiCall = (options: PerformApiCallOptions) => Promise<ApiResult>;

export interface ApiFactoryOptions {
  apiUrl: string;
  uid?: string | null;
  showAlert?: ShowAlert | null;
  performApiCall: PerformApiCall;
}
