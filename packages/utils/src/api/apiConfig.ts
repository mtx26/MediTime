export interface ApiDeps {
  getToken: () => Promise<string | null>;
  translate: (key: string) => string;
  trackAnalytics?: (event: string, data: Record<string, unknown>) => void;
}

let deps: ApiDeps | null = null;

export function configureApi(d: ApiDeps): void {
  deps = d;
}

export function getApiDeps(): ApiDeps {
  if (!deps) throw new Error('API not configured. Call configureApi() at app startup.');
  return deps;
}
