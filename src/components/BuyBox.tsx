'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Minus, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { formatMoney } from '@/src/utils/format';
import { useClient } from '@/src/context/ClientContext';
import { levelUnitPrice } from '@/src/utils/pricing';

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';

/** Quantity, special instructions and a Buy button: placing the order creates an order in the dashboard. */
export default function BuyBox({
  itemId,
  title,
  listPrice,
  salePrice,
  categoryId,
  unitLabel,
  inStock,
}: {
  /** Firestore id; empty for the built-in sample items (their orders have no linked item). */
  itemId: string;
  title: string;
  /** List (minorista) price of one unit. */
  listPrice: number;
  /** Sale price, when the item is on sale. */
  salePrice?: number;
  /** Category id; a wholesale customer's price level adjusts the list price by category. */
  categoryId?: string;
  /** What one unit is, e.g. "12 lb". */
  unitLabel: string;
  inStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const { client, level } = useClient();
  // Logged-out visitors pay the list (or sale) price; a wholesale customer pays their level's price.
  const unitPrice =
    client && level ? levelUnitPrice({ listPrice, salePrice, categoryId }, level).unit : (salePrice ?? listPrice);
  const [form, setForm] = useState({ instructions: '', name: '', phone: '', email: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStock) return;
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
          `[${client && level ? `Mayorista · ${level.name}` : 'Minorista'}] Cantidad: ${qty}${unitLabel ? ` × ${unitLabel}` : ''} · Precio unitario: ${formatMoney(unitPrice, 'USD')} · Total: ${formatMoney(unitPrice * qty, 'USD')}`,
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

  if (state === 'sent') {
    return (
      <p role="status" className="rounded-2xl bg-green-50 text-green-800 text-sm px-5 py-4">
        ¡Gracias! Tu pedido de {qty} × {title} fue enviado. Nos vamos a comunicar con vos en breve para confirmarlo.
      </p>
    );
  }

  return (
    <form onSubmit={buy} className="space-y-5">
      <div>
        <span className={labelClass}>Cantidad</span>
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
        {!inStock ? 'Sin stock' : state === 'sending' ? 'Enviando…' : `Comprar ahora · ${formatMoney(unitPrice * qty, 'USD')}`}
      </button>
    </form>
  );
}
