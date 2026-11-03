'use client';

import { useEffect, useState } from 'react';
import { subscribeToLeads } from '../services/dbService';
import type { Lead } from '../types/firestore';

/** Live list of the newest leads, for the dashboard overview / CRM view. */
export function useLeads(maxResults = 100) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToLeads(
        (next) => {
          setLeads(next);
          setError(null);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        maxResults
      );
    } catch (err) {
      // Firebase not configured.
      queueMicrotask(() => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.');
        setLoading(false);
      });
    }
    return () => unsubscribe?.();
  }, [maxResults]);

  return { leads, loading, error };
}
