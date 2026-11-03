'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Lead } from '../types/firestore';
import LeadList from './LeadList';

interface LeadInboxProps {
  open: boolean;
  onClose: () => void;
  /** Real-time leads (from the useLeads hook / getLeads listener). */
  leads: Lead[];
  loading: boolean;
  error: string | null;
  agentName: string;
}

/** Slide-over panel with the live lead inbox and one-tap WhatsApp replies. */
export default function LeadInbox({ open, onClose, leads, loading, error, agentName }: LeadInboxProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Order inbox"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#000000]/5 shrink-0">
          <div>
            <h2 className="font-semibold tracking-tight">Order inbox</h2>
            <p className="text-xs text-[#515154]">{newCount} new · updates live</p>
          </div>
          <button onClick={onClose} aria-label="Close inbox" className="p-2 rounded-full hover:bg-[#F5F5F7]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <p role="alert" className="p-6 text-sm text-red-600">
              {error}
            </p>
          ) : loading ? (
            <p className="p-6 text-sm text-[#515154]">Loading orders…</p>
          ) : (
            <LeadList leads={leads} agentName={agentName} />
          )}
        </div>
      </aside>
    </div>
  );
}
