'use client';

import SignInNotice from '@/src/components/SignInNotice';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Minus, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { formatMoney, priceWithShortUnit, pricingModeLabels, quantityLabel, quantityNounPlural } from '@/src/utils/format';
import { useClient } from '@/src/context/ClientContext';
import { optionPrice, saleOptions, type SaleSource } from '@/src/utils/pricing';
import type { PricingMode } from '@/src/types/firestore';

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';

/**
 * Unit, quantity, special instructions and a Buy button: placing the order creates an order in the dashboard.
 * Retail customers choose kilo or unidad; a logged-in wholesale customer chooses caja or unidad.
 */
export default function BuyBox({
  itemId,
  title,
  pricing,
  categoryId,
  inStock,
}: {
  /** Firestore id; empty for the built-in sample items (their orders have no linked item). */
  itemId: string;
  title: string;
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
  const options = saleOptions(pricing, wholesale ? 'wholesale' : 'retail');
  // Falls back to the first option when the chosen one is not offered (e.g. after logging in or out).
  const active = options.find((o) => o.mode === chosen) ?? options[0];
  const mode = active.mode;
  // Logged-out visitors pay the list (or sale) price; a wholesale customer pays their level's price.
  const unitPrice = optionPrice(active, categoryId, wholesale ? level : null).unit;

  const [form, setForm] = useState({ instructions: '', name: '', phone: '', email: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStock || !client) return;
    // A logged-in wholesale customer's business name and WhatsApp number fill in what they leave empty.
    const name = form.name.trim() || client?.businessName || '';
    const phone = form.phone.trim() || client?.phone || '';
    if (!name) return setFormError('Ingresá tu nombre.');
    if (!phone && !form.email.trim()) return setFormError('Ingresá un teléfono o un correo electrónico.');
    if (!db) {
      setState('error');
      return;
    }
    setFormError(null);
    setState('sending');
    try {
      await addDoc(collection(db, 'leads'), {
        name: client ? `${client.businessName}${name !== client.businessName ? ` (${name})` : ''}` : name,
        phone,
        email: form.email.trim(),
        property: title,
        ...(itemId ? { propertyId: itemId } : {}),
        // The price the customer saw (their price level included), and who they are.
        unitPrice,
        quantity: qty,
        ...(client && level ? { clientId: client.clientId, priceLevelId: level.id } : {}),
        channel: 'Portal',
        message: [
          // e.g. "Tomate perita - 2 Cajas @ $ 54/caja": the exact unit the order was priced in.
          `[${wholesale && level ? `Mayorista · ${level.name}` : 'Minorista'}] ${title} - ${quantityLabel(qty, mode)} @ ${priceWithShortUnit(unitPrice, mode)} · Total: ${formatMoney(unitPrice * qty)}`,
          form.instructions.trim() && `Indicaciones: ${form.instructions.trim()}`,
        ]
          .filter(Boolean)
          .join('\n'),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setState('sent');
    } catch {
      setState('error');
    }
  };

  if (!client) {
    return (
      <SignInNotice />
    );
  }

  if (state === 'sent') {
    return (
      <p role="status" className="rounded-2xl bg-green-50 text-green-800 text-sm px-5 py-4">
        ¡Gracias! Tu pedido de {quantityLabel(qty, mode)} de {title} fue enviado. Nos vamos a comunicar con vos en breve para confirmarlo.
      </p>
    );
  }

  return (
    <form onSubmit={buy} className="space-y-5">
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

      <div>
        <label htmlFor="b-instructions" className={labelClass}>Indicaciones especiales (opcional)</label>
        <textarea
          id="b-instructions"
          rows={3}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="ej. maduros para el viernes, entregar antes del mediodía, dejar en la puerta de atrás"
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="b-name" className={labelClass}>Tu nombre</label>
          <input id="b-name" className={fieldClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="b-phone" className={labelClass}>Teléfono</label>
          <input id="b-phone" type="tel" className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label htmlFor="b-email" className={labelClass}>Correo electrónico (opcional)</label>
        <input id="b-email" type="email" className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>

      {(formError || state === 'error') && (
        <p role="alert" className="text-sm text-red-600">
          {formError ?? 'No se pudo enviar tu pedido. Probá de nuevo.'}
        </p>
      )}

      <button
        type="submit"
        disabled={!inStock || state === 'sending'}
        className="w-full bg-[#1D1D1F] text-white py-4 rounded-full text-sm font-medium hover:bg-[#333336] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!inStock ? 'Sin stock' : state === 'sending' ? 'Enviando…' : `Comprar ahora · ${formatMoney(unitPrice * qty)}`}
      </button>
    </form>
  );
}
