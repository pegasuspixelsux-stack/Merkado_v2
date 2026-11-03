'use client';

import { useEffect, useState } from 'react';
import { subscribeClients, subscribePriceLevels } from '../services/pricingService';
import type { Client, PriceLevel } from '../types/firestore';

/** Live price levels (dashboard). */
export function usePriceLevels() {
  const [levels, setLevels] = useState<PriceLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      return subscribePriceLevels(
        (l) => {
          setLevels(l);
          setError(null);
          setLoading(false);
        },
        () => {
          setError('No se pudieron cargar los niveles de precio. Revisá que las reglas de Firestore estén publicadas.');
          setLoading(false);
        },
      );
    } catch {
      return undefined;
    }
  }, []);

  return { levels, loading, error };
}

/** Live customers (dashboard). */
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      return subscribeClients(
        (c) => {
          setClients(c);
          setError(null);
          setLoading(false);
        },
        () => {
          setError('No se pudieron cargar los clientes. Revisá que las reglas de Firestore estén publicadas.');
          setLoading(false);
        },
      );
    } catch {
      return undefined;
    }
  }, []);

  return { clients, loading, error };
}
