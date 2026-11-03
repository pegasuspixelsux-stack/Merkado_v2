'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useProperties } from '@/src/hooks/useProperties';
import { seedSampleProperties } from '@/src/services/dbService';
import ImportItems from '@/src/components/dashboard/ImportItems';
import { PropertyGrid, PropertyTable } from '@/src/components/dashboard/PropertyViews';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';
import { useCategories } from '@/src/hooks/useCategories';
import type { Property, PropertyType } from '@/src/types/firestore';

const selectClass =
  'bg-white border border-[#000000]/5 rounded-full px-4 py-2.5 text-xs outline-none cursor-pointer';

function PropertiesContent() {
  const { agent } = useAuth();
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, update, remove } = useProperties();
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  // Arriving from the Categories page (?category=fruit) pre-selects that category.
  const initialCategory = useSearchParams().get('category');
  const { categories, labelFor } = useCategories();
  const [type, setType] = useState<PropertyType | 'all'>(initialCategory || 'all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = items.filter((p) => (type === 'all' || p.type === type) && (!featuredOnly || p.featured));
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name })),
    // items whose category was removed still show up, under their old id
    ...Array.from(new Set(filtered.map((p) => p.type)))
      .filter((t) => !categories.some((c) => c.id === t))
      .map((t) => ({ id: t, name: t })),
  ]
    .map((c) => ({ ...c, items: filtered.filter((p) => p.type === c.id) }))
    .filter((g) => g.items.length > 0);
  const featuredCount = items.filter((p) => p.featured).length;
  const hasFilters = type !== 'all' || featuredOnly;

  const importSamples = async () => {
    if (!agent) return;
    setImporting(true);
    setActionError(null);
    try {
      await seedSampleProperties(agent.id, { name: agent.name, phone: agent.phone });
      await reload();
    } catch {
      setActionError('Could not import the sample items. Check that the Firestore rules are published.');
    } finally {
      setImporting(false);
    }
  };

  const onToggleFeatured = async (p: Property) => {
    setActionError(null);
    try {
      await update(p, { featured: !p.featured });
    } catch {
      setActionError('Could not update the item. You can only change your own items.');
    }
  };

  const onDelete = async (p: Property) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await remove(p);
    } catch {
      setActionError('Could not delete the item. You can only delete your own items.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Items"
        description={`${items.length} item${items.length === 1 ? '' : 's'} loaded`}
        action={
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all"
          >
            <Plus className="w-4 h-4" /> Add item
          </Link>
        }
      />

      <ImportItems onImported={reload} />

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={type} onChange={(e) => setType(e.target.value as PropertyType | 'all')} aria-label="Filter by category" className={selectClass}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 bg-white border border-[#000000]/5 rounded-full px-4 py-2.5 text-xs cursor-pointer">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
          Featured only
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              setFeaturedOnly(false);
              setType('all');
            }}
            className="text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]"
          >
            Reset
          </button>
        )}

        <div className="ml-auto inline-flex rounded-full bg-white border border-[#000000]/5 p-1" role="group" aria-label="View">
          {([
            ['grid', LayoutGrid, 'Grid view'],
            ['table', Rows3, 'Table view'],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-label={label}
              aria-pressed={view === key}
              className={`p-2 rounded-full transition-colors ${
                view === key ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:bg-[#F5F5F7]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {featuredCount > 5 && (
        <p className="mb-4 rounded-2xl bg-[#F5F5F7] px-5 py-3 text-sm">
          {featuredCount} items are featured. The homepage hero shows the 5 most recent.
        </p>
      )}

      {(error || actionError) && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error ?? actionError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#515154]">Loading items…</p>
      ) : filtered.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <p className="text-sm text-[#515154]">
            {items.length === 0
              ? 'No items yet. Add your first item, or start with the nine sample items from the website.'
              : 'No items match these filters.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={importSamples}
              disabled={importing}
              className="mt-5 bg-[#1D1D1F] text-white text-xs font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import sample items'}
            </button>
          )}
        </div>
      ) : (
        // Items grouped under their category; categories with no items are skipped.
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`cat-${g.id}`}>
              <h2 id={`cat-${g.id}`} className="flex items-baseline gap-2 mb-4 font-semibold tracking-tight">
                {g.name}
                <span className="text-xs font-normal text-[#515154]">{g.items.length}</span>
              </h2>
              {view === 'grid' ? (
                <PropertyGrid properties={g.items} onDelete={onDelete} onToggleFeatured={onToggleFeatured} categoryLabel={labelFor} />
              ) : (
                <PropertyTable properties={g.items} onDelete={onDelete} onToggleFeatured={onToggleFeatured} categoryLabel={labelFor} />
              )}
            </section>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs font-medium px-6 py-3 rounded-full bg-white border border-[#000000]/5 hover:bg-[#F5F5F7] disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
      {hasFilters && hasMore && (
        <p className="text-center text-xs text-[#515154] mt-3">Filters apply to the items loaded so far.</p>
      )}
    </>
  );
}

export default function PropertiesPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <PropertiesContent />
    </Suspense>
  );
}
