'use client';

import { seedSampleFavorites, toggleFavorite as toggleFavoriteInDb } from '@/src/services/favoritesService';
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { buildToken, resolvePinToken, toClientAccess } from '../services/pricingService';
import { PRICE_LEVEL_IDS, type ClientAccess, type PriceLevel } from '../types/firestore';

const STORAGE_KEY = 'merkado-client-token';

// The customer's access token lives in localStorage; useSyncExternalStore keeps every tab and component in step.
const listeners = new Set<() => void>();
const subscribeToken = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
};
const readToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: the session just won't be remembered */
  }
  listeners.forEach((l) => l());
};

export type TokenResult = 'ok' | 'invalid' | 'suspended' | 'error';

interface ClientState {
  /** The customer identified by the token in their link; null for ordinary visitors. */
  client: Pick<ClientAccess, 'clientId' | 'businessName' | 'contactName' | 'phone' | 'address' | 'receivingTime' | 'email' | 'notes' | 'allowLoose' | 'token'> | null;
  /** Their price level, kept live: when an admin edits it, prices on the page change at once. */
  level: PriceLevel | null;
  /** The saved link belongs to a suspended customer. */
  suspended: boolean;
  /** Checks the token from a link and remembers it on this device. */
  openWithToken: (token: string) => Promise<TokenResult>;
  /** Acceso mayoristas: the phone number registered by the admin plus the access code they were given. */
  login: (phone: string, code: string) => Promise<TokenResult>;
  signOutClient: () => void;
  /** Product ids the signed-in customer marked as favorites (empty for visitors). */
  favorites: string[];
  /** Adds or removes a product from the customer's favorites. No-op for visitors. */
  toggleFavorite: (productId: string) => Promise<void>;
}

/** Checks a token from a link and remembers it on this device. */
async function openWithToken(t: string): Promise<TokenResult> {
  if (!db) return 'error';
  const clean = t.trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(clean)) return 'invalid';
  try {
    const snap = await getDoc(doc(db, 'client_access', clean));
    if (!snap.exists()) return 'invalid';
    if (snap.data().status === 'suspended') return 'suspended';
    writeToken(clean);
    return 'ok';
  } catch {
    return 'error';
  }
}

const ClientContext = createContext<ClientState | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeToken, readToken, () => null);
  const [accessDoc, setAccessDoc] = useState<ClientAccess | null>(null);

  useEffect(() => {
    if (!db || !token) return;
    return onSnapshot(
      doc(db, 'client_access', token),
      (snap) => {
        if (snap.exists()) setAccessDoc(toClientAccess(snap.id, snap.data()));
        else {
          // The link was reset or the customer deleted: forget it.
          setAccessDoc(null);
          writeToken(null);
        }
      },
      () => setAccessDoc(null),
    );
  }, [token]);

  const access = token && accessDoc?.token === token ? accessDoc : null;
  const suspended = access?.status === 'suspended';
  const active = access && !suspended && (PRICE_LEVEL_IDS as readonly string[]).includes(access.priceLevelId) ? access : null;

  // Demo: a customer whose record has no favorites yet gets the 15 sample products once.
  const seeded = useRef<string | null>(null);
  const seedToken = active && !active.favoritesSet ? active.token : null;
  useEffect(() => {
    if (!seedToken || seeded.current === seedToken) return;
    seeded.current = seedToken;
    seedSampleFavorites(seedToken).catch(() => {
      seeded.current = null; // try again on the next visit
    });
  }, [seedToken]);

  const value = useMemo<ClientState>(
    () => ({
      client: active
        ? { clientId: active.clientId, businessName: active.businessName, contactName: active.contactName, phone: active.phone, address: active.address, receivingTime: active.receivingTime, email: active.email, notes: active.notes, allowLoose: active.allowLoose, token: active.token }
        : null,
      level: active
        ? { id: active.priceLevelId, name: active.levelName, description: '', categoryAdjustments: active.categoryAdjustments }
        : null,
      suspended: Boolean(suspended),
      openWithToken,
      login: async (phone: string, code: string) => {
        // A 4-digit PIN points to the customer's access token; anything longer is the access code itself.
        if (/^\d{4}$/.test(code.trim())) {
          try {
            const token = await resolvePinToken(phone, code.trim());
            return token ? openWithToken(token) : 'invalid';
          } catch {
            return 'error';
          }
        }
        return openWithToken(buildToken(phone, code));
      },
      signOutClient: () => writeToken(null),
      favorites: active?.favorites ?? [],
      toggleFavorite: async (productId: string) => {
        if (!active) return;
        await toggleFavoriteInDb(active.token, productId, !active.favorites.includes(productId));
      },
    }),
    [active, suspended],
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClient must be used inside <ClientProvider>');
  return ctx;
}
