declare module '*tokenUtils.js' {
  export function getToken(): Promise<string | null>;
}

declare module '../../../../apps/web/src/services/supabase/tokenUtils.js' {
  export function getToken(): Promise<string | null>;
}

declare module '*i18n.js' {
  interface I18nLike {
    t: (key: string) => string;
  }

  const i18n: I18nLike;
  export default i18n;
}

declare module '../../../../apps/web/src/i18n.js' {
  interface I18nLike {
    t: (key: string) => string;
  }

  const i18n: I18nLike;
  export default i18n;
}

declare module '*firebase.js' {
  export const analyticsPromise: Promise<unknown>;
}

declare module '../../../../apps/web/src/services/firebase/firebase.js' {
  export const analyticsPromise: Promise<unknown>;
}

declare module 'firebase/analytics' {
  export function logEvent(analytics: unknown, eventName: string, eventParams?: Record<string, unknown>): void;
}