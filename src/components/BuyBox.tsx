'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Minus, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { formatMoney } from '@/src/utils/format';

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';

/** Quantity, special instructions and a Buy button: placing the order creates an order in the dashboard. */
export default function BuyBox({
  itemId,
  title,
  retailPrice,
  wholesalePrice,
  unitLabel,
  inStock,
}: {
  /** Firestore id; empty for the built-in sample items (their orders have no linked item). */
  itemId: string;
  title: string;
  /** Minorista price of one unit (the sale price while on sale). */
  retailPrice: number;
  /** Mayorista price of one unit, when the item has one. */
  wholesalePrice?: number;
  /** What one unit is, e.g. "12 lb". */
  unitLabel: string;
  inStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [buyer, setBuyer] = useState<'retail' | 'wholesale'>('retail');
  const unitPrice = buyer === 'wholesale' && wholesalePrice !== undefined ? wholesalePrice : retailPrice;
  const [form, setForm] = useState({ instructions: '', name: '', phone: '', email: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStock) return;
    if (!form.name.trim()) return setFormError('Ingresá tu nombre.');
    if (!form.phone.trim() && !form.email.trim()) return setFormError('Ingresá un teléfono o un correo electrónico.');
    if (!db) {
      setState('error');
      return;
    }
    setFormError(null);
    setState('sending');
    try {
      await addDoc(collection(db, 'leads'), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        property: title,
        ...(itemId ? { propertyId: itemId } : {}),
        channel: 'Portal',
        message: [
          `[${buyer === 'wholesale' ? 'Mayorista' : 'Minorista'}] Cantidad: ${qty}${unitLabel ? ` × ${unitLabel}` : ''}`,
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
        <span className={labelClass}>Comprás como</span>
        <div role="radiogroup" aria-label="Comprás como" className="inline-flex rounded-full bg-[#F5F5F7] border border-[#000000]/5 p-0.5 text-sm font-medium">
          {([['retail', 'Minorista'], ['wholesale', 'Mayorista']] as const).map(([value, label]) => {
            const unavailable = value === 'wholesale' && wholesalePrice === undefined;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={buyer === value}
                disabled={unavailable}
                onClick={() => setBuyer(value)}
                className={`px-5 py-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  buyer === value ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:text-[#1D1D1F]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
