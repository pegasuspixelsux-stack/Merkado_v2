'use client';

import { useRouter } from 'next/navigation';
import PropertyForm from '@/src/components/dashboard/PropertyForm';
import { PageHeader } from '@/src/components/dashboard/ui';
import { createProperty } from '@/src/services/dbService';

export default function NewPropertyPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Add item"
        description="Add a photo, title, weight, price and category."
      />
      <PropertyForm
        submitLabel="Publish item"
        onSubmit={async (data) => {
          await createProperty(data);
          router.push('/dashboard/properties');
        }}
      />
    </>
  );
}
