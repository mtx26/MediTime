// ─── API Call Types ──────────────────────────────────────────────────────────

import type { ApiResult } from './result';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AlertLevel = 'success' | 'danger' | 'warning' | 'info';

export type ShowAlert = (level: AlertLevel, message: string) => void;

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
