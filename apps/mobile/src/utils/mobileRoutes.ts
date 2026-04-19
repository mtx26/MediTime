export function toMobileHref(webHref: string) {
  const [path, query] = webHref.split('?');
  const parts = path.split('/').filter(Boolean);
  const languageAwareRootRoutes = new Set([
    'calendar',
    'shared-user-calendar',
    'shared-token-calendar',
  ]);
  const mobileRootRoutes = new Set([
    ...languageAwareRootRoutes,
    'shared-calendars',
    'add-calendar',
  ]);
  const routeParts = mobileRootRoutes.has(parts[0]) ? parts : parts.slice(1);
  const schemaRouteParts = languageAwareRootRoutes.has(routeParts[0])
    ? ['calendars', ...routeParts]
    : routeParts;
  return `/${schemaRouteParts.join('/')}${query ? `?${query}` : ''}`;
}
