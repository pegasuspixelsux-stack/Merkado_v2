'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { useProperties } from '@/src/hooks/useProperties';
import { useCategories } from '@/src/hooks/useCategories';
import { PageHeader, cardClass, inputClass } from '@/src/components/dashboard/ui';

export default function CategoriesPage() {
  const { items, loading, error, hasMore } = useProperties(100);
  const { categories, add, remove, error: categoriesError } = useCategories();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await add(name);
      setMessage({ ok: true, text: `Added “${name.trim()}”.` });
      setName('');
    } catch (err) {
      const code = (err as { code?: string }).code;
      setMessage({
        ok: false,
        text:
          code === 'permission-denied'
            ? 'Permission denied. Check that the Firestore rules are published.'
            : err instanceof Error
              ? err.message
              : 'Could not add the category.',
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string, label: string) => {
    setMessage(null);
    try {
      await remove(id);
      setMessage({ ok: true, text: `Deleted “${label}”.` });
    } catch {
      setMessage({ ok: false, text: 'Could not delete the category.' });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Categories"
        description="Group your items. Add your own categories; the built-in ones can’t be deleted."
      />

      <form onSubmit={onAdd} className="flex flex-wrap items-center gap-3 mb-6 max-w-xl">
        <label htmlFor="cat-name" className="sr-only">New category name</label>
        <input
          id="cat-name"
          className={`${inputClass} flex-1 min-w-48`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="New category, e.g. Herbs"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {(error || categoriesError) && (
        <p role="alert" className="text-sm text-red-600 mb-4">{error ?? categoriesError}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {categories.map((c) => {
          const count = items.filter((p) => p.type === c.id).length;
          // Only block deleting when we can be sure the category is used by a loaded item.
          const inUse = count > 0;
          return (
            <div key={c.id} className={`${cardClass} group relative p-5 md:p-6 flex flex-col justify-between min-h-36`}>
              <Link
                href={`/dashboard/properties?category=${c.id}`}
                className="absolute inset-0 rounded-2xl"
                aria-label={`View ${c.name} items`}
              />
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold tracking-tight">{c.name}</h2>
                <ArrowUpRight className="w-4 h-4 text-[#515154] group-hover:text-[#1D1D1F] shrink-0" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-sm text-[#515154]">
                  <span className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                    {loading ? '–' : `${count}${hasMore ? '+' : ''}`}
                  </span>{' '}
                  {count === 1 && !hasMore ? 'item' : 'items'}
                </p>
                {!c.builtin && (
                  <button
                    type="button"
                    onClick={() => onDelete(c.id, c.name)}
                    disabled={inUse}
                    aria-label={inUse ? `${c.name} can’t be deleted while it has items` : `Delete ${c.name}`}
                    title={inUse ? 'Move or delete its items first' : 'Delete category'}
                    className="relative z-10 p-2 rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
