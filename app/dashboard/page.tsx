'use client';

import Link from 'next/link';
import { ArrowUpRight, Building2, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useLeads } from '@/src/hooks/useLeads';
import { useProperties } from '@/src/hooks/useProperties';
import LeadList from '@/src/components/LeadList';
import PropertyImage from '@/src/components/PropertyImage';
import { PageHeader, StatusPill, cardClass } from '@/src/components/dashboard/ui';
import { formatMoney } from '@/src/utils/format';

export default function OverviewPage() {
  const { agent } = useAuth();
  const { leads, loading: leadsLoading, error: leadsError } = useLeads(50);
  const { items, loading: propsLoading, error: propsError, hasMore } = useProperties(100);

  const stats = [
    { label: 'Properties', value: `${items.length}${hasMore ? '+' : ''}`, icon: Building2 },
    { label: 'Active', value: items.filter((p) => p.status === 'active').length, icon: CheckCircle2 },
    { label: 'Reserved', value: items.filter((p) => p.status === 'reserved').length, icon: Clock },
    { label: 'New leads', value: leads.filter((l) => l.status === 'new').length, icon: Inbox },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back${agent?.name ? `, ${agent.name.split(' ')[0]}` : ''}`}
        description="Here’s what’s happening with your portfolio."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${cardClass} p-6`}>
            <span className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
              <Icon className="w-4 h-4" />
            </span>
            <p className="text-3xl font-semibold tracking-tight">{propsLoading && label !== 'New leads' ? '–' : value}</p>
            <p className="text-xs uppercase tracking-wider text-[#515154] font-semibold mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#000000]/5">
            <h2 className="font-semibold tracking-tight">Recent properties</h2>
            <Link href="/dashboard/properties" className="text-xs inline-flex items-center gap-1 text-[#515154] hover:text-[#1D1D1F]">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {propsError ? (
            <p role="alert" className="p-6 text-sm text-red-600">{propsError}</p>
          ) : propsLoading ? (
            <p className="p-6 text-sm text-[#515154]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-[#515154]">
              No properties yet.{' '}
              <Link href="/dashboard/properties/new" className="underline underline-offset-2">Add your first listing</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-[#000000]/5">
              {items.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/properties/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-[#FBFBFD] transition-colors">
                    <div className="relative w-16 h-12 rounded-xl bg-[#E5E5EA] overflow-hidden shrink-0">
                      {p.photos[0] && <PropertyImage src={p.photos[0].url} alt="" variant="thumb" sizes="64px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-xs text-[#515154] truncate">
                        {formatMoney(p.price, p.currency)} · {[p.location.neighborhood, p.location.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#000000]/5">
            <h2 className="font-semibold tracking-tight">Latest leads</h2>
            <Link href="/dashboard/leads" className="text-xs inline-flex items-center gap-1 text-[#515154] hover:text-[#1D1D1F]">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {leadsError ? (
            <p role="alert" className="p-6 text-sm text-red-600">{leadsError}</p>
          ) : leadsLoading ? (
            <p className="p-6 text-sm text-[#515154]">Loading…</p>
          ) : (
            <LeadList leads={leads.slice(0, 3)} agentName={agent?.name ?? ''} />
          )}
        </section>
      </div>
    </>
  );
}
