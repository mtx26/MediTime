// ─── API Result Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string | null;
}

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

export type ApiSuccess<T = Record<string, unknown>> = { success: true } & T;

export type ApiResult = ApiSuccess | ApiFailure;
