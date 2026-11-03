'use client';

import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { createLead } from '../services/dbService';
import type { Property } from '../types/firestore';

const inputClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';

/** The listing's agent phone, or a site-wide fallback number from the environment. */
function whatsappLink(property: Property): string | null {
  const phone = property.agentPhone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 8) return null;
  const text = `Hola, estoy interesado en la propiedad: ${property.title} (ID: ${property.id})`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function PropertyContactCard({ property }: { property: Property }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const wa = whatsappLink(property);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setFormError('Add an email or a phone number so we can reach you.');
      return;
    }
    setFormError(null);
    setState('sending');
    try {
      await createLead({
        propertyId: property.id,
        clientName: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message,
        channel: 'Portal',
      });
      setForm({ name: '', phone: '', email: '', message: '' });
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <aside className="bg-white rounded-2xl border border-[#000000]/5 shadow-sm p-6 md:p-8 lg:sticky lg:top-24">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1D1D1F] text-white font-medium flex items-center justify-center">
          {(property.agentName || 'C').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Listing agent</p>
          <p className="font-medium">{property.agentName || 'Coastal Advisory'}</p>
        </div>
      </div>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1D1D1F] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-[#333336] transition-all shadow-sm"
        >
          <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
        </a>
      ) : (
        <p className="text-xs text-[#515154] bg-[#F5F5F7] rounded-xl px-4 py-3">
          WhatsApp isn’t available for this listing. Send a message below and we’ll reply shortly.
        </p>
      )}

      <div className="flex items-center gap-3 my-6 text-xs uppercase tracking-widest text-[#86868B]">
        <span className="h-px flex-1 bg-[#000000]/10" /> or <span className="h-px flex-1 bg-[#000000]/10" />
      </div>

      {state === 'sent' ? (
        <p role="status" className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-4">
          Thank you — an advisor will be in touch shortly.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="c-name" className={labelClass}>Full name</label>
            <input id="c-name" autoComplete="name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label htmlFor="c-phone" className={labelClass}>Phone</label>
              <input id="c-phone" type="tel" autoComplete="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label htmlFor="c-email" className={labelClass}>Email</label>
              <input id="c-email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="c-msg" className={labelClass}>Message</label>
            <textarea
              id="c-msg"
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder={`I’d like to know more about ${property.title}…`}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {(formError || state === 'error') && (
            <p role="alert" className="text-sm text-red-600">
              {formError ?? 'Something went wrong. Please try again or use WhatsApp.'}
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'sending'}
            className="w-full bg-white border border-[#1D1D1F] text-[#1D1D1F] py-3.5 rounded-xl text-sm font-medium hover:bg-[#1D1D1F] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{state === 'sending' ? 'Sending…' : 'Request details'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </aside>
  );
}
