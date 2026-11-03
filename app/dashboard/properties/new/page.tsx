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
        eyebrow="Inventario"
        title="Agregar artículo"
        description="Agregá una foto, el título, el peso, el precio y la categoría."
      />
      <PropertyForm
        submitLabel="Publicar artículo"
        onSubmit={async (data) => {
          await createProperty(data);
          router.push('/dashboard/properties');
        }}
      />
    </>
  );
}
