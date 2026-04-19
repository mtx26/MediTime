export function toMobileHref(webHref: string) {
  const [path, query] = webHref.split('?');
  const parts = path.split('/').filter(Boolean);
  const mobileRootRoutes = new Set([
    'calendar',
    'shared-user-calendar',
    'shared-token-calendar',
    'shared-calendars',
    'add-calendar',
  ]);
  const routeParts = mobileRootRoutes.has(parts[0]) ? parts : parts.slice(1);
  return `/${routeParts.join('/')}${query ? `?${query}` : ''}`;
}
