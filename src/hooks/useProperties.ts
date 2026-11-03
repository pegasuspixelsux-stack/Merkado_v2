'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  deleteProperty,
  updateProperty,
  getProperties,
  getPropertiesByAgent,
  type PropertyCursor,
} from '../services/dbService';
import type { Property } from '../types/firestore';

/**
 * Cursor-paginated properties for the signed-in agent
 * (admins see every agent's properties, agents see their own).
 */
export function useProperties(pageSize = 48) {
  const { agent } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [cursor, setCursor] = useState<PropertyCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = agent?.id;
  const isAdmin = agent?.role === 'admin';

  const fetchPage = useCallback(
    (after: PropertyCursor | null) => {
      const options = { pageSize, cursor: after };
      return isAdmin ? getProperties(options) : getPropertiesByAgent(agentId ?? '', options);
    },
    [agentId, isAdmin, pageSize]
  );

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    fetchPage(null)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Could not load properties.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, fetchPage]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more properties.');
    } finally {
      setLoadingMore(false);
    }
  };

  /** Re-fetches the first page (e.g. after importing sample data). */
  const reload = async () => {
    const page = await fetchPage(null);
    setItems(page.items);
    setCursor(page.nextCursor);
    setError(null);
  };

  /** Updates fields (e.g. featured) and reflects the change in the list immediately. */
  const update = async (property: Property, changes: Partial<Pick<Property, 'featured' | 'status'>>) => {
    await updateProperty(property.id, changes);
    setItems((prev) => prev.map((p) => (p.id === property.id ? { ...p, ...changes } : p)));
  };

  const remove = async (property: Property) => {
    await deleteProperty(property.id);
    setItems((prev) => prev.filter((p) => p.id !== property.id));
  };

  return { items, loading, loadingMore, error, hasMore: Boolean(cursor), loadMore, reload, update, remove };
}
