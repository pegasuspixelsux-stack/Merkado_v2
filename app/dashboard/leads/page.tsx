'use client';

import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useLeads } from '@/src/hooks/useLeads';
import LeadList from '@/src/components/LeadList';
import AddOrder from '@/src/components/dashboard/AddOrder';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';
import type { LeadStatus } from '@/src/types/firestore';

const filters: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

export default function LeadsPage() {
  const { agent } = useAuth();
  const { leads, loading, error } = useLeads(200);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  const visible = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const count = (s: LeadStatus | 'all') => (s === 'all' ? leads.length : leads.filter((l) => l.status === s).length);

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Orders"
        description="Orders from the website and the ones you add, updated live. Reply on WhatsApp in one tap."
      />

      <AddOrder />

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter orders by status">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
              filter === f.value ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]'
            }`}
          >
            {f.label} <span className="opacity-60 ml-1">{count(f.value)}</span>
          </button>
        ))}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        {error ? (
          <p role="alert" className="p-6 text-sm text-red-600">
            {error}
          </p>
        ) : loading ? (
          <p className="p-6 text-sm text-[#515154]">Loading orders…</p>
        ) : (
          <LeadList
            leads={visible}
            agentName={agent?.name ?? ''}
            emptyText={leads.length ? 'No orders with this status.' : 'No orders yet. Website orders appear here instantly.'}
          />
        )}
      </div>
    </>
  );
}
