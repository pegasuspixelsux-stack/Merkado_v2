'use client';

import Link from 'next/link';
import { useClient } from '@/src/context/ClientContext';
import { levelUnitPrice } from '@/src/utils/pricing';
import { formatMoney } from '@/src/utils/format';

/**
 * Price display for one item.
 * Logged-out visitors see the list (minorista) price; a wholesale customer sees their level's price,
 * listPrice × (1 + category adjustment %), with a badge naming the level. Logging out reverts at once.
 */
export default function ItemPriceView({
  listPrice,
  salePrice,
  categoryId,
  currency,
}: {
  listPrice: number;
  salePrice?: number;
  categoryId?: string;
  currency: string;
}) {
  const { client, level } = useClient();

  if (client && level) {
    const { tier, unit, onSale } = levelUnitPrice({ listPrice, salePrice, categoryId }, level);
    return (
      <dl className="max-w-md">
        <div className="rounded-2xl bg-white border border-[#000000]/5 p-4">
          <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Tu precio</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold">{formatMoney(unit, currency)}</span>
            {(onSale || unit !== listPrice) && <s className="text-sm text-[#86868B]">{formatMoney(onSale ? tier : listPrice, currency)}</s>}
          </dd>
          <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Precio {level.name}
          </span>
        </div>
      </dl>
    );
  }

  const onSale = salePrice !== undefined;
  return (
    <dl className="grid grid-cols-2 gap-3 max-w-md">
      <div className="rounded-2xl bg-white border border-[#000000]/5 p-4">
        <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Minorista</dt>
        <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-semibold">{formatMoney(salePrice ?? listPrice, currency)}</span>
          {onSale && <s className="text-sm text-[#86868B]">{formatMoney(listPrice, currency)}</s>}
        </dd>
        {onSale && <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>}
      </div>
      <div className="rounded-2xl bg-white border border-[#000000]/5 p-4">
        <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Mayorista</dt>
        <dd className="mt-1 text-sm text-[#515154]">Ingresá con “Acceso mayoristas” para ver tu precio</dd>
        <Link href="/#contact" className="inline-block mt-2 text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
          Conseguí precios mayoristas
        </Link>
      </div>
    </dl>
  );
}
