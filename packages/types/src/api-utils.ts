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

export type ApiSuccess<T extends object = Record<string, unknown>> = { success: true } & T;

export type ApiResult<T extends object = Record<string, unknown>> = ApiSuccess<T> | ApiFailure;

export interface PerformApiCallOptions<TBody = unknown> {
  url: string;
  method?: HttpMethod;
  headers?: HeadersInit | null;
  body?: TBody | null;
  origin: string;
  uid?: string | null;
  analyticsEvent?: string | null;
  analyticsData?: Record<string, unknown>;
  showAlert?: ShowAlert | null;
}

export type PerformApiCall = <T extends object = Record<string, unknown>, TBody = unknown>(
  options: PerformApiCallOptions<TBody>
) => Promise<ApiResult<T>>;

export interface ApiFactoryOptions {
  apiUrl: string;
  uid?: string | null;
  showAlert?: ShowAlert | null;
  performApiCall: PerformApiCall;
}
