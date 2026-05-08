export const getValidRedirect = (redirect: string | null | undefined): string | null => {
  if (!redirect) return null;

  try {
    if (redirect.startsWith('/')) {
      return redirect;
    }
    const url = new URL(redirect);
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    if (origin && url.origin === origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch (_err) {
    // invalid URL
  }
  return null;
};
