export function extractGTIN01(text: string): string | null {
  if (!text) return null;

  const gs1Separator = String.fromCharCode(29);
  const cleaned = text.replaceAll(gs1Separator, '');

  const explicitMatch = cleaned.match(/\(01\)\s*([0-9]{14})/);
  if (explicitMatch?.[1]) {
    return explicitMatch[1];
  }

  const compactMatch = cleaned.match(/(?:^|[^0-9])01([0-9]{14})(?:[^0-9]|$)/);
  return compactMatch?.[1] ?? null;
}
