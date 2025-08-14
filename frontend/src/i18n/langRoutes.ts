import { enabledLanguageCodes } from '../config/languages';

export const SUPPORTED_LANGS = enabledLanguageCodes as string[];
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

export function getLangFromPath(pathname: string): Lang | null {
  const segment = pathname.split('/')[1];
  return (SUPPORTED_LANGS as readonly string[]).includes(segment) ? (segment as Lang) : null;
}

export function stripLangFromPath(pathname: string): string {
  const lang = getLangFromPath(pathname);
  if (!lang) return pathname;
  const parts = pathname.split('/').slice(2);
  return '/' + parts.join('/');
}

export function localizePath(path: string, lang: Lang): string {
  if (!path.startsWith('/')) path = '/' + path;
  return `/${lang}${path}`;
}
