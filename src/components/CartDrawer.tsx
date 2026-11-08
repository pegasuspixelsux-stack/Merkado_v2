'use client';

import SignInNotice from '@/src/components/SignInNotice';
import { useEffect, useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { HomeProperty } from '@/src/lib/homeData';
import { formatMoney, priceWithShortUnit, quantityLabel } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import { useClient } from '@/src/context/ClientContext';

export interface CartLine {
  item: HomeProperty;
  qty: number;
  /** Identifies the line when the same product can appear twice (different unit); defaults to the item id. */
  key?: string;
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
  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    fulfillment: 'delivery' as 'delivery' | 'pickup',
    address: '',
    date: '',
    time: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  // A signed-in client's profile (contact, WhatsApp, address, receiving hour) fills in the order form.
  const profileToken = client?.token;
  useEffect(() => {
    if (!client) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once per signed-in client
    setForm((f) => ({
      ...f,
      name: f.name || client.contactName || client.businessName,
      phone: f.phone || client.phone,
      address: f.address || client.address,
      time: f.time || client.receivingTime,
      email: f.email || client.email,
      notes: f.notes || client.notes,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileToken]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const total = lines.reduce((sum, l) => sum + unitPriceOf(l.item) * l.qty, 0);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length || !client) return;
    // A logged-in wholesale customer's business name and WhatsApp number fill in what they leave empty.
    const name = form.name.trim() || client?.businessName || '';
    const phone = form.phone.trim() || client?.phone || '';
    if (!name) return setFormError('Ingresá tu nombre.');
    if (!phone && !form.email.trim()) return setFormError('Ingresá un teléfono o un correo electrónico.');
    if (form.fulfillment === 'delivery' && !form.address.trim()) return setFormError('Ingresá la dirección de entrega.');
    if (!form.time) return setFormError('Elegí la hora en que vas a recibir o retirar el pedido.');
    if (!db) {
      setState('error');
      return;
    }
    setFormError(null);
    setState('sending');
    try {
      // One order per cart line, written together: either all of them are saved or none.
      const batch = writeBatch(db);
      // Shared by every product line of this order, so the dashboard shows them as one order.
      const orderId = doc(collection(db, 'leads')).id;
      const tag =
        client && level ? `Mayorista · ${level.name}` : buyerType === 'wholesale' ? 'Mayorista' : 'Minorista';
      const deliveryLines = [
        form.fulfillment === 'delivery' ? `Entrega a domicilio: ${form.address.trim()}` : 'Retiro en local',
        `${form.fulfillment === 'delivery' ? 'Hora de recepción' : 'Hora de retiro'}: ${form.date ? `${form.date} ` : ''}${form.time}`,
        `Contacto: ${name} · WhatsApp: ${phone || '—'}`,
        'Precios sujetos a confirmación: se confirma el pedido con precios ajustados antes del envío.',
        form.notes.trim() && `Instrucciones especiales: ${form.notes.trim()}`,
      ];
      for (const { item, qty } of lines) {
        const unit = unitPriceOf(item);
        batch.set(doc(collection(db, 'leads')), {
          orderId,
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
            `[${tag}] ${item.title} - ${quantityLabel(qty, item.pricingMode)} @ ${priceWithShortUnit(unit, item.pricingMode)} · Subtotal: ${formatMoney(unit * qty)}`,
            ...deliveryLines,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'new',
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setState('sent');
      // Keep the profile data for the client's next order; clear only what belongs to this one.
      setForm({
        ...emptyForm,
        name: client?.contactName || client?.businessName || '',
        phone: client?.phone ?? '',
        address: client?.address ?? '',
        time: client?.receivingTime ?? '',
        email: client?.email ?? '',
        notes: client?.notes ?? '',
      });
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
                {lines.map(({ item, qty, key }) => {
                  const id = key ?? String(item.id);
                  return (
                    <li key={id} className="flex gap-3 py-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#E5E5EA] shrink-0">
                        <PropertyImage src={item.image} alt={item.title} variant="thumb" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-[#515154]">
                          {priceWithShortUnit(unitPriceOf(item), item.pricingMode)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => onChangeQty(id, -1)} disabled={qty <= 1} aria-label={`Disminuir ${item.title}`} className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="min-w-16 text-center text-sm font-medium" aria-live="polite">{quantityLabel(qty, item.pricingMode)}</span>
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

              {!client && (
                <SignInNotice />
              )}
              <form id="cart-form" onSubmit={place} className={`space-y-3 pt-4 ${client ? '' : 'hidden'}`}>
                <input className={fieldClass} placeholder={client ? `Nombre de contacto (${client.businessName})` : 'Tu nombre'} aria-label="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={fieldClass} placeholder={client?.phone ? `Teléfono (${client.phone})` : 'Teléfono'} aria-label="Teléfono" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={fieldClass} placeholder="Correo electrónico (opcional)" aria-label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <fieldset className="grid grid-cols-2 gap-2 pt-1">
                  <legend className="sr-only">Entrega o retiro</legend>
                  {([['delivery', 'Entrega a domicilio'], ['pickup', 'Retiro en local']] as const).map(([value, label]) => (
                    <label key={value} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm text-center transition-colors ${form.fulfillment === value ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white' : 'border-[#000000]/10 bg-[#FBFBFD] hover:bg-[#F5F5F7]'}`}>
                      <input type="radio" name="fulfillment" value={value} checked={form.fulfillment === value} onChange={() => setForm({ ...form, fulfillment: value })} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </fieldset>
                {form.fulfillment === 'delivery' && (
                  <input className={fieldClass} placeholder="Dirección de entrega" aria-label="Dirección de entrega" autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-xs text-[#515154] mb-1">Fecha (opcional)</span>
                    <input className={fieldClass} type="date" min={new Date().toLocaleDateString('en-CA')} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-[#515154] mb-1">{form.fulfillment === 'delivery' ? 'Hora de recepción' : 'Hora de retiro'}</span>
                    <input className={fieldClass} type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </label>
                </div>
                <textarea className={`${fieldClass} resize-none`} rows={3} maxLength={1000} placeholder="Instrucciones especiales (opcional): cómo preparar, entrada de servicio, cómo llamar…" aria-label="Instrucciones especiales" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </form>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-[#000000]/5 px-6 py-5 space-y-3 shrink-0">
            <p className="rounded-xl bg-amber-50 text-amber-900 text-xs leading-relaxed px-3 py-2.5">
              <strong className="font-semibold">Precios del día.</strong> Los precios de mercado valen para hoy. Si el pedido es para otro día, pueden cambiar: te confirmamos el pedido con los precios ajustados antes del envío.
            </p>
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
              disabled={state === 'sending' || !client}
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
