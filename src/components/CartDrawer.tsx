'use client';

import { useEffect, useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { HomeProperty } from '@/src/lib/homeData';
import { formatMoney } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import { useClient } from '@/src/context/ClientContext';

export interface CartLine {
  item: HomeProperty;
  qty: number;
}

/** Price of one unit: the sale price while on sale, else the regular price. */
export const unitPriceOf = (p: HomeProperty): number =>
  p.unitPrice ?? (Number((p.salePrice ?? p.price).replace(/[^0-9.]/g, '')) || 0);

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';

export default function CartDrawer({
  open,
  onClose,
  lines,
  onChangeQty,
  onRemove,
  onPlaced,
  buyerType,
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  onChangeQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaced: () => void;
  buyerType: 'retail' | 'wholesale';
}) {
  const { client, level } = useClient();
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const total = lines.reduce((sum, l) => sum + unitPriceOf(l.item) * l.qty, 0);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length) return;
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
      // One order per cart line, written together: either all of them are saved or none.
      const batch = writeBatch(db);
      const tag =
        client && level ? `Mayorista · ${level.name}` : buyerType === 'wholesale' ? 'Mayorista' : 'Minorista';
      for (const { item, qty } of lines) {
        const unit = unitPriceOf(item);
        batch.set(doc(collection(db, 'leads')), {
          name: client ? `${client.businessName}${name !== client.businessName ? ` (${name})` : ''}` : name,
          phone,
          // The price the customer saw and accepted (their price level included), and who they are.
          unitPrice: unit,
          quantity: qty,
          ...(client && level ? { clientId: client.clientId, priceLevelId: level.id } : {}),
          email: form.email.trim(),
          property: item.title,
          // Firestore ids are strings; the built-in samples use numbers and are not real items.
          ...(typeof item.id === 'string' ? { propertyId: item.id } : {}),
          channel: 'Portal',
          message: [
            `[${tag}] Cantidad: ${qty}${item.area ? ` × ${item.area}` : ''} · Precio unitario: ${formatMoney(unit)} · Subtotal: ${formatMoney(unit * qty)}`,
            form.notes.trim(),
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'new',
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setState('sent');
      setForm({ name: '', phone: '', email: '', notes: '' });
      onPlaced();
    } catch {
      setState('error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#000000]/5 shrink-0">
          <h2 className="font-semibold tracking-tight inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Tu carrito
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar carrito" className="p-2 rounded-full hover:bg-[#F5F5F7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state === 'sent' && lines.length === 0 ? (
            <p role="status" className="text-sm text-green-700 py-10 text-center">
              ¡Gracias! Tu pedido fue enviado. Nos vamos a comunicar con vos en breve.
            </p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-[#515154] py-10 text-center">Tu carrito está vacío.</p>
          ) : (
            <>
              <ul className="divide-y divide-[#000000]/5">
                {lines.map(({ item, qty }) => {
                  const id = String(item.id);
                  return (
                    <li key={id} className="flex gap-3 py-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#E5E5EA] shrink-0">
                        <PropertyImage src={item.image} alt={item.title} variant="thumb" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-[#515154]">
                          {item.area ? `${item.area} · ` : ''}
                          {formatMoney(unitPriceOf(item))}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => onChangeQty(id, -1)} disabled={qty <= 1} aria-label={`Disminuir ${item.title}`} className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm" aria-live="polite">{qty}</span>
                          <button type="button" onClick={() => onChangeQty(id, 1)} aria-label={`Aumentar ${item.title}`} className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => onRemove(id)} aria-label={`Quitar ${item.title}`} className="ml-auto p-2 rounded-full text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatMoney(unitPriceOf(item) * qty)}</p>
                    </li>
                  );
                })}
              </ul>

              <form id="cart-form" onSubmit={place} className="space-y-3 pt-4">
                <input className={fieldClass} placeholder={client ? `Nombre de contacto (${client.businessName})` : 'Tu nombre'} aria-label="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={fieldClass} placeholder={client?.phone ? `Teléfono (${client.phone})` : 'Teléfono'} aria-label="Teléfono" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={fieldClass} placeholder="Correo electrónico (opcional)" aria-label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <textarea className={`${fieldClass} resize-none`} rows={2} placeholder="Dirección de entrega o notas (opcional)" aria-label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </form>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-[#000000]/5 px-6 py-5 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#515154]">Total</span>
              <span className="text-lg font-semibold">{formatMoney(total)}</span>
            </div>
            {(formError || state === 'error') && (
              <p role="alert" className="text-xs text-red-600">
                {formError ?? 'No se pudo enviar tu pedido. Probá de nuevo.'}
              </p>
            )}
            <button
              type="submit"
              form="cart-form"
              disabled={state === 'sending'}
              className="w-full bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3.5 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {state === 'sending' ? 'Enviando…' : 'Hacer pedido'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
