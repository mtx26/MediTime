export function toMobileHref(webHref: string) {
  const [path, query] = webHref.split('?');
  const parts = path.split('/').filter(Boolean);
  const routeParts = /^[a-z]{2}$/.test(parts[0] ?? '') ? parts.slice(1) : parts;
  const [root, firstParam, page] = routeParts;

  const appendQuery = (href: string) => `${href}${query ? `?${query}` : ''}`;

  if (!root) return '/';

  if (root === '(auth)') {
    if (firstParam) return `/(auth)/${firstParam}`;
    return '/(auth)/login';
  }

  if (root === 'auth' && firstParam === 'callback') {
    return '/auth/callback';
  }

  if (['login', 'register', 'reset-password', 'reset-password-confirm', 'verify-email'].includes(root)) {
    return `/(auth)/${root}`;
  }

  if (['settings', 'privacy', 'terms'].includes(root)) {
    return `/${root}`;
  }

  if (['shared-calendars', 'add-calendar', 'notifications', 'accept-invite'].includes(root)) {
    return appendQuery(`/${routeParts.join('/')}`);
  }

  if (root === 'calendars') {
    const type = firstParam;
    const calendarId = routeParts[2];
    const calendarPage = routeParts[3];

    if ((type === 'calendar' || type === 'shared-user-calendar') && calendarId) {
      const detailHref = `/calendars/${type}/${calendarId}`;
      return calendarPage ? appendQuery(`${detailHref}/${calendarPage}`) : detailHref;
    }

    return '/calendars';
  }

  if ((root === 'calendar' || root === 'shared-user-calendar') && firstParam) {
    const detailHref = `/calendars/${root}/${firstParam}`;
    return page ? appendQuery(`${detailHref}/${page}`) : detailHref;
  }

  return '/calendars';
}
