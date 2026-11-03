'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { createLead } from '../../services/dbService';
import type { LeadChannel } from '../../types/firestore';
import { formatMoney } from '../../utils/format';
import { cardClass, inputClass, labelClass } from './ui';

const channels: LeadChannel[] = ['Direct', 'WhatsApp', 'Portal'];

const empty = { name: '', phone: '', email: '', itemId: '', quantity: '1', channel: 'Direct' as LeadChannel, notes: '' };

/** Lets staff record an order that did not come through the website (phone, WhatsApp, in person). */
export default function AddOrder() {
  const { items } = useProperties(100);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const available = items.filter((p) => p.inStock !== false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(form.quantity);
    if (!form.name.trim()) return setError('Add the customer name.');
    if (!form.phone.trim() && !form.email.trim()) return setError('Add a phone number or an email.');
    if (!form.itemId) return setError('Choose an item.');
    if (!Number.isInteger(quantity) || quantity < 1) return setError('Quantity must be a whole number, 1 or more.');
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      const item = items.find((p) => p.id === form.itemId);
      await createLead({
        propertyId: form.itemId,
        clientName: form.name,
        phone: form.phone,
        email: form.email,
        channel: form.channel,
        message: [`Quantity: ${quantity}${item?.weight ? ` × ${item.weight} ${item.unit ?? ''}`.trimEnd() : ''}`, form.notes.trim()]
          .filter(Boolean)
          .join('\n'),
      });
      setDone(`Order added for ${form.name.trim()}.`);
      setForm(empty);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'permission-denied'
          ? 'Permission denied. Check that the Firestore rules are published.'
          : 'Could not add the order.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setDone(null);
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all"
      >
        <Plus className="w-4 h-4" /> Add order
      </button>

      {done && !open && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {done}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className={`${cardClass} p-6 mt-3 max-w-2xl space-y-5`}>
          <h2 className="font-semibold tracking-tight">New order</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="o-name" className={labelClass}>Customer name</label>
              <input id="o-name" className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-phone" className={labelClass}>Phone</label>
              <input id="o-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-email" className={labelClass}>Email (optional)</label>
              <input id="o-email" type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-channel" className={labelClass}>Received by</label>
              <select id="o-channel" className={inputClass} value={form.channel} onChange={(e) => set('channel', e.target.value as LeadChannel)}>
                {channels.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="col-span-2">
              <label htmlFor="o-item" className={labelClass}>Item</label>
              <select id="o-item" className={inputClass} value={form.itemId} onChange={(e) => set('itemId', e.target.value)}>
                <option value="">Choose an item…</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatMoney(p.salePrice ?? p.price, p.currency)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="o-qty" className={labelClass}>Quantity</label>
              <input id="o-qty" type="number" min={1} step={1} inputMode="numeric" className={inputClass} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor="o-notes" className={labelClass}>Notes (optional)</label>
            <textarea id="o-notes" rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Delivery address, preferred time…" />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add order'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-5 py-3 rounded-full hover:bg-[#F5F5F7]">
              Close
            </button>
          </div>
          {done && (
            <p role="status" className="text-sm text-green-700">
              {done}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
