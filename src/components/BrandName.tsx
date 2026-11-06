'use client';

import { useBusiness } from '@/src/context/BusinessContext';

/** The Merkado logo, the orange (public/Merkado_L.png), used until another one is uploaded in Ajustes. */
export const DEFAULT_LOGO = '/Merkado_L.png';

/**
 * The logo (from Ajustes, or the default) next to the catalogue title: the name set in Ajustes, or the default
 * "Merkado para Mayoristas" (short "Merkado M" on phones). Inline content: put it inside the heading / link.
 */
export default function BrandName() {
  const { businessName, logo } = useBusiness();
  return (
    <span className="inline-flex items-center gap-2.5 align-middle">
      <span className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo || DEFAULT_LOGO} alt="" className="h-9 w-9 object-contain" />
      </span>
      <span>
        {businessName ? (
          <>{businessName}.</>
        ) : (
          <>
            Merkado<span className="sm:hidden"> M</span>
            <span className="hidden sm:inline"> para Mayoristas</span>.
          </>
        )}
      </span>
    </span>
  );
}
