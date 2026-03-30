const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

export function isValidImageFile(file: File | null | undefined): file is File {
  if (!file) {
    return false;
  }

  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return false;
  }

  const fileName = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

export function isValidImagePreviewUrl(url: string | null | undefined, currentOrigin: string): url is string {
  if (!url || !url.startsWith('blob:') || !url.includes(currentOrigin)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'blob:';
  } catch {
    return false;
  }
}
