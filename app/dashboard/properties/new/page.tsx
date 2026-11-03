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
        eyebrow="Portfolio"
        title="Add listing"
        description="Your progress is saved on this device as a draft while you type."
      />
      <PropertyForm
        submitLabel="Publish listing"
        onSubmit={async (data) => {
          await createProperty(data);
          router.push('/dashboard/properties');
        }}
      />
    </>
  );
}
