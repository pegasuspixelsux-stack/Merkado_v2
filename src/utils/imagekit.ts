const ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '';

/**
 * Adds an ImageKit transformation string to an ImageKit URL,
 * e.g. ikUrl(url, 'w-1200,q-80,f-auto') -> "...?tr=w-1200,q-80,f-auto".
 * URLs hosted elsewhere (such as the Unsplash samples) are returned unchanged.
 */
export function ikUrl(src: string, transformation: string): string {
  if (!ENDPOINT || !src.startsWith(ENDPOINT) || src.includes('tr=')) return src;
  return `${src}${src.includes('?') ? '&' : '?'}tr=${transformation}`;
}

/** Transformations used across the public property page. */
export const IK = {
  hero: 'w-1200,q-80,f-auto',
  thumb: 'w-300,q-60,f-auto',
  lightbox: 'w-1800,q-80,f-auto',
  /** Social share image: 1200x630 crop, JPEG (the widest crawler support). */
  og: 'w-1200,h-630,fo-auto,q-80,f-jpg',
} as const;
