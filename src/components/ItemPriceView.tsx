'use client';

import Link from 'next/link';
import { useClient } from '@/src/context/ClientContext';
import { optionPrice, saleOptions, type SaleSource } from '@/src/utils/pricing';
import { formatMoney, pricingModeLabels, withUnitSuffix } from '@/src/utils/format';

/**
 * Price display for one item, one card per way of buying it.
 * Logged-out visitors (minorista) see kilo / unidad at the list price; a wholesale customer sees
 * caja / unidad at their level's price (list price × the category adjustment %), with a badge naming the level.
 * Logging out reverts at once.
 */
export default function ItemPriceView({ pricing, categoryId }: { pricing: SaleSource; categoryId?: string }) {
  const { client, level } = useClient();
  const wholesale = !!(client && level);
  const options = saleOptions(pricing, wholesale ? 'wholesale' : 'retail');

  return (
    <dl className="grid grid-cols-2 gap-3 max-w-md">
      {options.map((o) => {
        const { unit, was } = optionPrice(o, categoryId, wholesale ? level : null);
        return (
          <div key={o.mode} className="rounded-2xl bg-white border border-[#000000]/5 p-4">
            <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">
              {wholesale ? 'Tu precio' : 'Minorista'} · {pricingModeLabels[o.mode]}
            </dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-semibold">{withUnitSuffix(formatMoney(unit), o.mode)}</span>
              {was !== undefined && <s className="text-sm text-[#86868B]">{formatMoney(was)}</s>}
            </dd>
            {!wholesale && o.salePrice !== undefined && (
              <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>
            )}
          </div>
        );
      })}

      {wholesale && level ? (
        <div className="col-span-2">
          <span className="inline-block bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Precio {level.name}
          </span>
        </div>
      ) : (
        <div className="col-span-2 rounded-2xl bg-white border border-[#000000]/5 p-4">
          <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Mayorista</dt>
          <dd className="mt-1 text-sm text-[#515154]">Ingresá con “Acceso mayoristas” para ver tu precio por caja o por unidad</dd>
          <Link href="/#contact" className="inline-block mt-2 text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
            Conseguí precios mayoristas
          </Link>
        </div>
      )}
    </dl>
  );
}
