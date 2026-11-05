'use client';

import { useBusiness } from '@/src/context/BusinessContext';

/**
 * The catalogue title: the name set in Ajustes, or the default "Merkado para Mayoristas" (short "Merkado M" on phones)
 * until one is set. Renders inline content, so put it inside the heading / link of the page.
 */
export default function BrandName() {
  const { businessName } = useBusiness();
  if (businessName) return <>{businessName}.</>;
  return (
    <>
      Merkado<span className="sm:hidden"> M</span>
      <span className="hidden sm:inline"> para Mayoristas</span>.
    </>
  );
}
