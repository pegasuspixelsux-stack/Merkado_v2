/**
 * Public-domain / CC0 photos for the catalog, matched by product name.
 * Each entry: words that must appear in the title (accents and case ignored) -> photo URL.
 * The first matching entry wins, so put the more specific names first.
 */
export interface ItemImage {
  match: string[];
  url: string;
}

export const itemImages: ItemImage[] = [];

export const norm = (v: string) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function imageFor(title: string): string | null {
  const t = norm(title);
  const hit = itemImages.find((i) => i.match.every((w) => t.includes(norm(w))));
  return hit?.url ?? null;
}
