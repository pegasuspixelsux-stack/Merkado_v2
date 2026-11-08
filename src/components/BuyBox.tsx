'use client';

import SignInNotice from '@/src/components/SignInNotice';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus } from 'lucide-react';
import { formatMoney, priceWithShortUnit, pricingModeLabels, quantityLabel, quantityNounPlural } from '@/src/utils/format';
import { useClient } from '@/src/context/ClientContext';
import { useCart } from '@/src/context/CartContext';
import { optionPrice, saleOptions, type SaleSource } from '@/src/utils/pricing';
import type { PricingMode } from '@/src/types/firestore';

const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';

/**
 * Unit, quantity and an "Agregar al carrito" button. The item goes into the shared cart; the customer then closes the
 * order (opens the cart to send it) or keeps shopping, and sends every item together as one order.
 * Retail customers choose kilo or unidad; a logged-in wholesale customer chooses caja or unidad.
 */
export default function BuyBox({
  itemId,
  title,
  image,
  pricing,
  categoryId,
  inStock,
}: {
  /** Id the cart tracks the product by: the Firestore id, or the sample's number for the built-in samples. */
  itemId: string | number;
  title: string;
  /** First photo, shown in the cart. */
  image: string;
  /** Price, base unit, box / unit weights and manual prices of the item. */
  pricing: SaleSource;
  /** Category id; a wholesale customer's price level adjusts the list price by category. */
  categoryId?: string;
  inStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [chosen, setChosen] = useState<PricingMode | null>(null);
  const { client, level } = useClient();
  const wholesale = !!(client && level);
  const options = saleOptions(pricing, wholesale ? 'wholesale' : 'retail', { allowLoose: client?.allowLoose });
  // Falls back to the first option when the chosen one is not offered (e.g. after logging in or out).
  const active = options.find((o) => o.mode === chosen) ?? options[0];
  const mode = active.mode;
  // Logged-out visitors pay the list (or sale) price; a wholesale customer pays their level's price.
  const unitPrice = optionPrice(active, categoryId, wholesale ? level : null).unit;

  const { add, setOpen } = useCart();
  const [added, setAdded] = useState<{ qty: number; mode: PricingMode } | null>(null);

  const addToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStock) return;
    // The cart keeps what the customer saw here: the unit they picked and the price in that unit.
    add(
      {
        id: itemId,
        title,
        location: '',
        price: priceWithShortUnit(unitPrice, mode),
        beds: 0,
        baths: 0,
        area: '',
        image,
        href: typeof itemId === 'string' ? `/items/${itemId}` : undefined,
        pricingMode: mode,
        unitPrice,
        inStock: true,
      },
      qty,
    );
    setAdded({ qty, mode });
  };

  if (!client) {
    return (
      <SignInNotice />
    );
  }

  if (added) {
    return (
      <div role="status" className="rounded-2xl bg-green-50 text-green-900 px-5 py-5 space-y-4">
        <p className="flex items-start gap-2 text-sm font-medium">
          <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Agregado al carrito: {quantityLabel(added.qty, added.mode)} de {title}.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 bg-[#1D1D1F] text-white py-3.5 rounded-full text-sm font-medium hover:bg-[#333336] transition-all"
          >
            Cerrar pedido
          </button>
          <Link
            href="/items"
            className="flex-1 text-center border border-[#1D1D1F]/30 py-3.5 rounded-full text-sm font-medium hover:bg-white transition-all"
          >
            Seguir comprando
          </Link>
        </div>
        <button type="button" onClick={() => setAdded(null)} className="text-xs underline underline-offset-2 text-green-900/80 hover:text-green-900">
          Agregar más de este producto
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={addToCart} className="space-y-5">
      {options.length > 1 && (
        <div>
          <span className={labelClass}>Comprar por</span>
          <div className="inline-flex flex-wrap rounded-3xl bg-[#F5F5F7] p-1" role="group" aria-label="Comprar por">
            {options.map((o) => (
              <button
                key={o.mode}
                type="button"
                onClick={() => setChosen(o.mode)}
                aria-pressed={o.mode === mode}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  o.mode === mode ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:text-[#1D1D1F]'
                }`}
              >
                {pricingModeLabels[o.mode].replace('Por ', '')} · {formatMoney(optionPrice(o, categoryId, wholesale ? level : null).unit)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className={labelClass}>{`Cantidad (${quantityNounPlural(mode)})`}</span>
        <div className="inline-flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Disminuir cantidad"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium" aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(999, q + 1))}
            aria-label="Aumentar cantidad"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!inStock}
        className="w-full bg-[#1D1D1F] text-white py-4 rounded-full text-sm font-medium hover:bg-[#333336] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!inStock ? 'Sin stock' : `Agregar al carrito · ${formatMoney(unitPrice * qty)}`}
      </button>
    </form>
  );
}
