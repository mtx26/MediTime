export const getValidRedirect = (redirect: string | null | undefined): string | null => {
  if (!redirect) return null;

  try {
    if (redirect.startsWith('/')) {
      return redirect;
    }
    const url = new URL(redirect);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch (_err) {
    // invalid URL
  }
  return null;
};
