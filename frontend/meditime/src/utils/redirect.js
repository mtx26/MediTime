export const getValidRedirect = (redirect) => {
  if (!redirect) return null;

  try {
    if (redirect.startsWith('/')) {
      return redirect;
    }
    const url = new URL(redirect);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch (err) {
    // invalid URL
  }
  return null;
};
