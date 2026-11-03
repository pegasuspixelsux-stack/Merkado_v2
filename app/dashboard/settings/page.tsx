'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { PageHeader, cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';

export default function SettingsPage() {
  const { agent, updateProfile } = useAuth();
  const [name, setName] = useState(agent?.name ?? '');
  const [phone, setPhone] = useState(agent?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  if (!agent) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setMessage({ type: 'ok', text: 'Profile saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" description="Your profile and team tools." />

      <form onSubmit={save} className={`${cardClass} p-6 md:p-8 max-w-xl space-y-6`}>
        <div>
          <label htmlFor="s-email" className={labelClass}>Email</label>
          <input id="s-email" className={`${inputClass} text-[#515154]`} value={agent.email} disabled />
        </div>
        <div>
          <label htmlFor="s-name" className={labelClass}>Name</label>
          <input id="s-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="s-phone" className={labelClass}>Phone / WhatsApp</label>
          <input id="s-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+598 99 123 456" />
        </div>
        <div>
          <p className={labelClass}>Role</p>
          <p className="text-sm capitalize">{agent.role}</p>
        </div>
        {message && (
          <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      {agent.role === 'admin' && (
        <Link
          href="/admin"
          className={`${cardClass} mt-6 max-w-xl p-6 flex items-center justify-between hover:bg-[#F5F5F7] transition-colors`}
        >
          <div>
            <p className="font-medium">Team &amp; users</p>
            <p className="text-xs text-[#515154]">Add agents, change roles and deactivate accounts.</p>
          </div>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </>
  );
}
