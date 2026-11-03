'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useProperties } from '@/src/hooks/useProperties';
import { seedSampleProperties } from '@/src/services/dbService';
import { PropertyGrid, PropertyTable } from '@/src/components/dashboard/PropertyViews';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';
import { operationLabels, statusLabels, typeLabels } from '@/src/utils/format';
import type { Property, PropertyOperation, PropertyStatus, PropertyType } from '@/src/types/firestore';

const selectClass =
  'bg-white border border-[#000000]/5 rounded-full px-4 py-2.5 text-xs outline-none cursor-pointer';

export default function PropertiesPage() {
  const { agent } = useAuth();
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, update, remove } = useProperties();
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [operation, setOperation] = useState<PropertyOperation | 'all'>('all');
  const [type, setType] = useState<PropertyType | 'all'>('all');
  const [neighborhood, setNeighborhood] = useState('all');
  const [status, setStatus] = useState<PropertyStatus | 'all'>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const neighborhoods = useMemo(
    () =>
      Array.from(new Set(items.map((p) => p.location.neighborhood).filter(Boolean) as string[])).sort(),
    [items]
  );

  const filtered = items.filter(
    (p) =>
      (operation === 'all' || p.operation === operation) &&
      (type === 'all' || p.type === type) &&
      (status === 'all' || p.status === status) &&
      (neighborhood === 'all' || p.location.neighborhood === neighborhood) &&
      (!featuredOnly || p.featured)
  );
  const featuredCount = items.filter((p) => p.featured).length;
  const hasFilters = operation !== 'all' || type !== 'all' || status !== 'all' || neighborhood !== 'all' || featuredOnly;

  const importSamples = async () => {
    if (!agent) return;
    setImporting(true);
    setActionError(null);
    try {
      await seedSampleProperties(agent.id, { name: agent.name, phone: agent.phone });
      await reload();
    } catch {
      setActionError('Could not import the sample properties. Check that the Firestore rules are published.');
    } finally {
      setImporting(false);
    }
  };

  const onToggleFeatured = async (p: Property) => {
    setActionError(null);
    try {
      await update(p, { featured: !p.featured });
    } catch {
      setActionError('Could not update the property. You can only change your own listings.');
    }
  };

  const onDelete = async (p: Property) => {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await remove(p);
    } catch {
      setActionError('Could not delete the property. You can only delete your own listings.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        description={`${items.length} listing${items.length === 1 ? '' : 's'} loaded`}
        action={
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all"
          >
            <Plus className="w-4 h-4" /> Add listing
          </Link>
        }
      />

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={operation} onChange={(e) => setOperation(e.target.value as PropertyOperation | 'all')} aria-label="Filter by operation" className={selectClass}>
          <option value="all">All operations</option>
          {Object.entries(operationLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as PropertyType | 'all')} aria-label="Filter by property type" className={selectClass}>
          <option value="all">All types</option>
          {Object.entries(typeLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} aria-label="Filter by neighborhood" className={selectClass}>
          <option value="all">All neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus | 'all')} aria-label="Filter by status" className={selectClass}>
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
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
              setOperation('all');
              setType('all');
              setStatus('all');
              setNeighborhood('all');
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
          {featuredCount} listings are featured. The homepage hero shows the 5 most recent.
        </p>
      )}

      {(error || actionError) && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error ?? actionError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#515154]">Loading properties…</p>
      ) : filtered.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <p className="text-sm text-[#515154]">
            {items.length === 0
              ? 'No properties yet. Add your first listing, or start with the nine sample properties from the website.'
              : 'No properties match these filters.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={importSamples}
              disabled={importing}
              className="mt-5 bg-[#1D1D1F] text-white text-xs font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import sample properties'}
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <PropertyGrid properties={filtered} onDelete={onDelete} onToggleFeatured={onToggleFeatured} />
      ) : (
        <PropertyTable properties={filtered} onDelete={onDelete} onToggleFeatured={onToggleFeatured} />
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
        <p className="text-center text-xs text-[#515154] mt-3">Filters apply to the listings loaded so far.</p>
      )}
    </>
  );
}
