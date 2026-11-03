'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addCategory, deleteCategory, getCategories } from '../services/dbService';
import { mergeCategories } from '../utils/format';
import type { Category } from '../types/firestore';

/** Built-in categories plus the ones added in the dashboard (stored in Firestore). */
export function useCategories() {
  const [custom, setCustom] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setCustom(await getCategories());
      setError(null);
    } catch {
      setError('Could not load custom categories. Check that the Firestore rules are published.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void reload();
  }, [reload]);

  const categories = useMemo(() => mergeCategories(custom), [custom]);
  const labelFor = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? id,
    [categories]
  );

  const add = async (name: string) => {
    await addCategory(name, categories);
    await reload();
  };
  const remove = async (id: string) => {
    await deleteCategory(id);
    await reload();
  };

  return { categories, labelFor, loading, error, add, remove };
}
