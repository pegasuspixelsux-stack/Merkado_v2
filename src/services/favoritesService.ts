import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getActiveProperties, getProperty } from './dbService';
import type { Property } from '../types/firestore';

const CLIENT_ACCESS = 'client_access';

/** The demo favorites: 15 high-rotation kitchen staples. Each entry lists the words that identify it in the catalogue. */
export const SAMPLE_FAVORITES: { name: string; match: string[] }[] = [
  { name: 'Papa blanca', match: ['papa blanca', 'papa'] },
  { name: 'Cebolla blanca', match: ['cebolla blanca', 'cebolla'] },
  { name: 'Tomate perita', match: ['tomate perita', 'perita'] },
  { name: 'Morrón rojo', match: ['morron rojo', 'morron'] },
  { name: 'Zanahorias de quinta', match: ['zanahoria'] },
  { name: 'Lechuga crespa', match: ['lechuga crespa', 'lechuga'] },
  { name: 'Rúcula de campo', match: ['rucula'] },
  { name: 'Limón de cuatro estaciones', match: ['limon'] },
  { name: 'Ajo suelto', match: ['ajo'] },
  { name: 'Zapallo calabacín (Anco)', match: ['calabacin', 'anco'] },
  { name: 'Perejil fresco', match: ['perejil'] },
  { name: 'Albahaca fresca', match: ['albahaca'] },
  { name: 'Palta Hass', match: ['palta hass', 'palta'] },
  { name: 'Tomates cherry', match: ['cherry'] },
  { name: 'Espinaca fresca', match: ['espinaca'] },
];

const plain = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Loads the demo favorites into a customer's record the first time (when it has no favorites field yet).
 * Each sample product is matched to an active catalogue product by name; products that are not in the
 * catalogue are skipped. Always writes the field, so it is never loaded twice.
 */
export async function seedSampleFavorites(token: string): Promise<void> {
  if (!db) return;
  const products = await getActiveProperties();
  const ids: string[] = [];
  for (const sample of SAMPLE_FAVORITES) {
    let found: string | undefined;
    for (const key of sample.match) {
      const k = plain(key);
      const hit =
        products.find((p) => plain(p.title) === k && !ids.includes(p.id)) ??
        products.find((p) => new RegExp(`(^|[^a-z])${k}([^a-z]|$)`).test(plain(p.title)) && !ids.includes(p.id));
      if (hit) {
        found = hit.id;
        break;
      }
    }
    if (found) ids.push(found);
  }
  await updateDoc(doc(db, CLIENT_ACCESS, token), { favorites: ids });
}

/**
 * Adds or removes a product id in the customer's favorites list. Only ids are stored:
 * prices are never saved, they are looked up again whenever the favorites are shown or ordered.
 * `token` is the customer's access token (the id of their client_access record).
 */
export async function toggleFavorite(token: string, productId: string, makeFavorite: boolean): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado.');
  await updateDoc(doc(db, CLIENT_ACCESS, token), {
    favorites: makeFavorite ? arrayUnion(productId) : arrayRemove(productId),
  });
}

/**
 * The favorites with their current data (price, stock, pricing mode), fetched fresh from the
 * products collection. Products that were deleted or are no longer active are left out.
 */
export async function getFavorites(productIds: string[]): Promise<Property[]> {
  const found = await Promise.all(productIds.map((id) => getProperty(id).catch(() => null)));
  return found.filter((p): p is Property => p !== null && p.status === 'active');
}
