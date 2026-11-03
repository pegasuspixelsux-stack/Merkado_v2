'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getProperty, updateLeadStatus } from '../services/dbService';
import type { Lead, LeadStatus } from '../types/firestore';
import { timeAgo, whatsappUrl } from '../utils/format';

const statuses: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;

/** Leads store a property id (new) or the property name as text (website form). */
function usePropertyTitles(ids: string[]) {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const key = ids.join('|');

  useEffect(() => {
    const missing = Array.from(new Set(ids)).filter((id) => FIRESTORE_ID.test(id) && !(id in titles));
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        getProperty(id)
          .then((p) => [id, p?.title ?? ''] as const)
          .catch(() => [id, ''] as const)
      )
    ).then((entries) => {
      if (!cancelled) setTitles((t) => ({ ...t, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (id: string) => (FIRESTORE_ID.test(id) ? titles[id] || '' : id);
}

interface LeadListProps {
  leads: Lead[];
  /** Name used to sign the WhatsApp message. */
  agentName: string;
  emptyText?: string;
}

export default function LeadList({ leads, agentName, emptyText = 'No orders yet.' }: LeadListProps) {
  const titleFor = usePropertyTitles(leads.map((l) => l.propertyId));
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (lead: Lead, status: LeadStatus) => {
    setError(null);
    try {
      await updateLeadStatus(lead.id, status);
    } catch {
      setError('Could not update the order.');
    }
  };

  if (!leads.length) return <p className="p-6 text-sm text-[#515154]">{emptyText}</p>;

  return (
    <>
      {error && (
        <p role="alert" className="px-6 pt-4 text-xs text-red-600">
          {error}
        </p>
      )}
      <ul className="divide-y divide-[#000000]/5">
        {leads.map((lead) => {
          const property = titleFor(lead.propertyId);
          const firstName = lead.clientName.split(' ')[0] || 'there';
          const text =
            `Hi ${firstName}, this is ${agentName || 'your advisor'} from Merkado. ` +
            (property
              ? `Thank you for your interest in ${property}. `
              : 'Thank you for getting in touch. ') +
            'When would be a good time to talk?';
          const wa = lead.phone ? whatsappUrl(lead.phone, text) : null;

          return (
            <li key={lead.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{lead.clientName || 'Unnamed'}</p>
                  <p className="text-xs text-[#515154]">
                    {timeAgo(lead.createdAt)} · {lead.channel}
                  </p>
                </div>
                <select
                  value={lead.status}
                  onChange={(e) => setStatus(lead, e.target.value as LeadStatus)}
                  aria-label={`Status for ${lead.clientName || lead.email}`}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs outline-none cursor-pointer ${
                    lead.status === 'new' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'
                  }`}
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {property && (
                <p className="text-xs uppercase tracking-wider text-[#515154] font-semibold">{property}</p>
              )}
              {lead.message && <p className="text-sm font-light whitespace-pre-line">{lead.message}</p>}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1D1D1F] text-white font-medium px-4 py-2 rounded-full hover:bg-[#333336] transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                ) : (
                  <span
                    title="This order has no phone number"
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] text-[#86868B] px-4 py-2 rounded-full cursor-not-allowed"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> No phone
                  </span>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] px-4 py-2 rounded-full hover:bg-[#E5E5EA] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] px-4 py-2 rounded-full hover:bg-[#E5E5EA] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
