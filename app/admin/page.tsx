'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Inbox, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import RequireAuth from '@/src/components/RequireAuth';
import ListingsPanel from './_components/listings-panel';
import LeadsPanel from './_components/leads-panel';
import UsersPanel from './_components/users-panel';

type Tab = 'listings' | 'leads' | 'users';

export default function AdminDashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const router = useRouter();
  const { agent: staff, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('listings');

  if (!staff) return null; // RequireAuth guarantees an agent; this narrows the type

  const tabs: { key: Tab; label: string; icon: typeof Building2; adminOnly?: boolean }[] = [
    { key: 'listings', label: 'Listings', icon: Building2 },
    { key: 'leads', label: 'Leads', icon: Inbox },
    { key: 'users', label: 'Users', icon: Users, adminOnly: true },
  ];

  return (
    <>
      <header className="bg-white border-b border-[#000000]/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold tracking-tight">Coastal.</Link>
            <span className="text-xs text-[#515154] uppercase tracking-widest">Dashboard</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-[#515154]">
              {staff.name || staff.email} · {staff.role}
            </span>
            <button
              onClick={async () => {
                await logout();
                router.replace('/admin/login');
              }}
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-[#1D1D1F] text-white hover:bg-[#333336]"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <nav className="flex gap-2 mb-8" aria-label="Dashboard sections">
          {tabs
            .filter((t) => !t.adminOnly || staff.role === 'admin')
            .map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={`inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
                  tab === key ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#1D1D1F] hover:bg-[#E5E5EA]'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
        </nav>

        {tab === 'listings' && <ListingsPanel />}
        {tab === 'leads' && <LeadsPanel />}
        {tab === 'users' && staff.role === 'admin' && <UsersPanel currentUserId={staff.id} />}
      </main>
    </>
  );
}
