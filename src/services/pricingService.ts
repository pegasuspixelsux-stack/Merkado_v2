import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRICE_LEVEL_IDS, type Client, type ClientAccess, type ClientStatus, type PriceLevel } from '../types/firestore';

const PRICE_LEVELS = 'price_levels';
const CLIENTS = 'clients';
const CLIENT_ACCESS = 'client_access';

export const defaultLevelNames: Record<string, string> = {
  level_1: 'Nivel 1 - Mayorista estándar',
  level_2: 'Nivel 2 - Mayorista premium',
  level_3: 'Nivel 3',
  level_4: 'Nivel 4',
  level_5: 'Nivel 5',
};

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.');
  return db;
}

const millis = (v: unknown) => (v as { toMillis?: () => number } | null | undefined)?.toMillis?.();

function adjustmentsOf(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries((raw ?? {}) as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

export function toPriceLevel(id: string, d: DocumentData | undefined): PriceLevel {
  return {
    id,
    name: typeof d?.name === 'string' && d.name ? d.name : (defaultLevelNames[id] ?? id),
    description: typeof d?.description === 'string' ? d.description : '',
    categoryAdjustments: adjustmentsOf(d?.categoryAdjustments),
    updatedAt: millis(d?.updatedAt),
  };
}

export function toClient(id: string, d: DocumentData): Client {
  return {
    id,
    businessName: d.businessName ?? '',
    contactName: d.contactName ?? '',
    phone: d.phone ?? '',
    address: d.address ?? '',
    priceLevelId: d.priceLevelId ?? 'level_1',
    status: d.status === 'suspended' ? 'suspended' : 'active',
    accessToken: d.accessToken ?? '',
    createdAt: millis(d.createdAt),
  };
}

export function toClientAccess(token: string, d: DocumentData): ClientAccess {
  return {
    token,
    clientId: d.clientId ?? '',
    businessName: d.businessName ?? '',
    contactName: d.contactName ?? '',
    phone: d.phone ?? '',
    priceLevelId: d.priceLevelId ?? '',
    levelName: d.levelName ?? '',
    categoryAdjustments: adjustmentsOf(d.categoryAdjustments),
    status: d.status === 'suspended' ? 'suspended' : 'active',
  };
}

/** Phone number reduced to the digits that matter, so '099 123 456' and '+598 99 123 456' match. */
export function phoneKey(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('598') && d.length > 9) d = d.slice(3);
  return d.replace(/^0+/, '');
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** The access code a customer types (10 characters, about 50 bits; no look-alike letters). */
export function newAccessCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Token = registered phone + secret code. It is the id of client_access/{token}, so both the link and the phone + code login resolve to it. */
export const buildToken = (phone: string, code: string) => `${phoneKey(phone)}-${code.trim().toUpperCase()}`;
export const newAccessToken = (phone: string) => buildToken(phone, newAccessCode());
export const codeOfToken = (token: string) => token.split('-')[1] ?? '';

/** The customer's portal link. */
export const accessLink = (origin: string, token: string) => `${origin}/client?token=${token}`;

// ---------------------------------------------------------- price levels

/** Live list of the five price levels (missing ones come back with default names and no adjustments). */
export function subscribePriceLevels(
  onLevels: (levels: PriceLevel[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(requireDb(), PRICE_LEVELS),
    (snap) => {
      const byId = new Map(snap.docs.map((d) => [d.id, d.data()]));
      onLevels(PRICE_LEVEL_IDS.map((id) => toPriceLevel(id, byId.get(id))));
    },
    (err) => onError?.(err),
  );
}

/**
 * Saves a price level and copies its name and adjustments onto the access record of every customer on it,
 * so their open catalogs update immediately.
 */
export async function savePriceLevel(level: Omit<PriceLevel, 'updatedAt'>): Promise<number> {
  const firestore = requireDb();
  const name = level.name.trim();
  const affected = await getDocs(query(collection(firestore, CLIENT_ACCESS), where('priceLevelId', '==', level.id)));
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, PRICE_LEVELS, level.id), {
    name,
    description: level.description.trim(),
    categoryAdjustments: level.categoryAdjustments,
    updatedAt: serverTimestamp(),
  });
  for (const d of affected.docs) {
    batch.update(d.ref, { levelName: name, categoryAdjustments: level.categoryAdjustments, updatedAt: serverTimestamp() });
  }
  await batch.commit();
  return affected.size;
}

// --------------------------------------------------------------- clients

/** Live list of customers (staff only). */
export function subscribeClients(onClients: (clients: Client[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(requireDb(), CLIENTS),
    (snap) =>
      onClients(snap.docs.map((d) => toClient(d.id, d.data())).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))),
    (err) => onError?.(err),
  );
}

export interface ClientInput {
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
  priceLevelId: string;
  status?: ClientStatus;
}

const accessData = (clientId: string, c: ClientInput, level: PriceLevel) => ({
  clientId,
  businessName: c.businessName.trim(),
  contactName: c.contactName.trim(),
  phone: c.phone.trim(),
  priceLevelId: level.id,
  levelName: level.name,
  categoryAdjustments: level.categoryAdjustments,
  status: c.status ?? 'active',
  updatedAt: serverTimestamp(),
});

const clientData = (c: ClientInput) => ({
  businessName: c.businessName.trim(),
  contactName: c.contactName.trim(),
  phone: c.phone.trim(),
  address: c.address.trim(),
  priceLevelId: c.priceLevelId,
  status: c.status ?? 'active',
});

/** Creates the customer and its access record together. Returns the portal token. */
export async function createClient(input: ClientInput, level: PriceLevel): Promise<string> {
  const firestore = requireDb();
  const token = newAccessToken(input.phone);
  const ref = doc(collection(firestore, CLIENTS));
  const batch = writeBatch(firestore);
  batch.set(ref, { ...clientData(input), accessToken: token, createdAt: serverTimestamp() });
  batch.set(doc(firestore, CLIENT_ACCESS, token), accessData(ref.id, input, level));
  await batch.commit();
  return token;
}

/**
 * Saves changes to a customer and keeps its access record in step (level, status, contact details).
 * Changing the phone number issues a new token (the phone is part of it); returns it, or null if unchanged.
 */
export async function updateClient(client: Client, input: ClientInput, level: PriceLevel): Promise<string | null> {
  const firestore = requireDb();
  const batch = writeBatch(firestore);
  let token = client.accessToken;
  let renewed: string | null = null;
  if (phoneKey(input.phone) !== phoneKey(client.phone)) {
    renewed = token = newAccessToken(input.phone);
    batch.delete(doc(firestore, CLIENT_ACCESS, client.accessToken));
  }
  batch.update(doc(firestore, CLIENTS, client.id), { ...clientData(input), ...(renewed ? { accessToken: renewed } : {}) });
  batch.set(doc(firestore, CLIENT_ACCESS, token), accessData(client.id, input, level));
  await batch.commit();
  return renewed;
}

/** Invalidates the old link and returns a new token. */
export async function resetClientAccess(client: Client, level: PriceLevel): Promise<string> {
  const firestore = requireDb();
  const token = newAccessToken(client.phone);
  const input: ClientInput = { ...client };
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, CLIENT_ACCESS, client.accessToken));
  batch.set(doc(firestore, CLIENT_ACCESS, token), accessData(client.id, input, level));
  batch.update(doc(firestore, CLIENTS, client.id), { accessToken: token });
  await batch.commit();
  return token;
}

export async function deleteClient(client: Client): Promise<void> {
  const firestore = requireDb();
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, CLIENT_ACCESS, client.accessToken));
  batch.delete(doc(firestore, CLIENTS, client.id));
  await batch.commit();
}
