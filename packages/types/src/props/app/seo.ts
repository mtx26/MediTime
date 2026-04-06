// ─── SEO & PWA Types ─────────────────────────────────────────────────────────

export interface SeoAuthor {
  name: string;
  email: string;
  github: string;
}

export interface SeoMeta {
  siteName: string;
  twitterSite: string;
  ogType: string;
  ogImage: string;
  twitterCard: string;
}

export interface PwaIcon {
  src: string;
  type: string;
  sizes: string;
  purpose?: string;
}

export interface PwaScreenshot {
  src: string;
  sizes: string;
  type: string;
  form_factor?: string;
}

export interface PwaShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  icons: Array<{ src: string; sizes: string }>;
}

export interface PwaConfig {
  scope: string;
  display: string;
  orientation: string;
  backgroundColor: string;
  themeColor: string;
  categories: string[];
  icons: PwaIcon[];
  screenshots: PwaScreenshot[];
  related_applications: unknown[];
  prefer_related_applications: boolean;
  dir: string;
}

export interface SeoConfig {
  BASE_URL: string;
  APP_VERSION: string;
  AUTHOR: SeoAuthor;
  META: SeoMeta;
  PWA: PwaConfig;
}

export type TranslatorInput = ((key: string) => string) | Record<string, unknown>;

export interface SchemaOrgDocument {
  '@context': string;
  '@graph': Array<Record<string, unknown>>;
}
