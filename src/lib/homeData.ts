import { getActiveProperties } from '../services/dbService';
import type { Property } from '../types/firestore';
import { formatMoney, operationLabels, typeLabels } from '../utils/format';
import { ikUrl } from '../utils/imagekit';

export type HeroSlide = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  tagline: string;
  image: string;
  /** Property detail page; only set for slides built from Firestore properties. */
  href?: string;
};

export type HomeProperty = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  /** Detail page; only set for properties stored in Firestore. */
  href?: string;
};

const place = (p: Property) => [p.location.city, p.location.state].filter(Boolean).join(', ');

function toSlide(p: Property): HeroSlide {
  const sentence = p.description.split(/(?<=[.!?])\s/)[0].trim();
  const tagline = sentence
    ? sentence.length > 110
      ? `${sentence.slice(0, 107).trimEnd()}…`
      : sentence
    : `${operationLabels[p.operation]} · ${typeLabels[p.type]}`;
  return {
    id: p.id,
    href: `/properties/${p.id}`,
    title: p.title,
    location: place(p),
    price: formatMoney(p.price, p.currency),
    tagline,
    image: ikUrl(p.photos[0]?.url ?? '', 'w-2000,q-80,f-auto'),
  };
}

function toHomeProperty(p: Property): HomeProperty {
  return {
    id: p.id,
    href: `/properties/${p.id}`,
    title: p.title,
    location: place(p),
    price: formatMoney(p.price, p.currency),
    beds: p.specs.bedrooms,
    baths: p.specs.bathrooms,
    area: `${p.specs.areaM2.toLocaleString('en-US')} m²`,
    image: p.photos[0]?.url ?? '',
  };
}

/**
 * Homepage data, loaded on the server so the links to each property page are in the
 * HTML that reaches the browser (no client-side database request needed).
 * Hero: featured properties (newest first, max 5); if none are featured, the newest 5.
 */
export async function loadHomeData(): Promise<{ properties: HomeProperty[]; slides: HeroSlide[] }> {
  try {
    const active = await getActiveProperties();
    const featured = active.filter((p) => p.featured);
    const hero = (featured.length ? featured : active).slice(0, 5);
    return { properties: active.map(toHomeProperty), slides: hero.map(toSlide) };
  } catch {
    return { properties: [], slides: [] }; // the page falls back to its built-in samples
  }
}
