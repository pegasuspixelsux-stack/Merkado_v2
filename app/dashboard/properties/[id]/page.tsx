'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/src/components/dashboard/PropertyForm';
import { PageHeader } from '@/src/components/dashboard/ui';
import { getProperty, updateProperty } from '@/src/services/dbService';
import type { Property } from '@/src/types/firestore';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProperty(id)
      .then((p) => {
        if (cancelled) return;
        if (p) setProperty(p);
        else setError('This item no longer exists.');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this item.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-[#515154]">Loading item…</p>;
  if (error || !property) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error ?? 'Item not found.'}
      </p>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Inventory" title="Edit item" description={property.title} />
      <PropertyForm
        initial={property}
        submitLabel="Save changes"
        onSubmit={async (data) => {
          // The owner of a listing never changes.
          const { agentId, ...changes } = data;
          void agentId;
          await updateProperty(id, changes);
          router.push('/dashboard/properties');
        }}
      />
    </>
  );
}
