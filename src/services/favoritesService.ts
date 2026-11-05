import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getProperty } from './dbService';
import type { Property } from '../types/firestore';

const CLIENT_ACCESS = 'client_access';

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
