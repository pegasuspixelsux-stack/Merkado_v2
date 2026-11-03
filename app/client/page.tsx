import { Suspense } from 'react';
import type { Metadata } from 'next';
import ClientPortal from './ClientPortal';

export const metadata: Metadata = {
  title: 'Tu cuenta | Merkado',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <ClientPortal />
    </Suspense>
  );
}
