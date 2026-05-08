export function getWebcalUrl(apiUrl: string, token: string) {
  const url = `${apiUrl}/api/calendar/${token}.ics`;
  return url.replace(/^https?:\/\//, 'webcal://');
}
