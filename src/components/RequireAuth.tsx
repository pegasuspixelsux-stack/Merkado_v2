'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import type { AgentRole } from '../types/firestore';

interface RequireAuthProps {
  children: ReactNode;
  /** Restrict to a role, e.g. "admin". Any active agent passes when omitted. */
  role?: AgentRole;
  /** Where to send signed-out visitors. Default: /admin/login */
  redirectTo?: string;
}

/**
 * Wrap any dashboard page with this: signed-out visitors are redirected to the login page,
 * and nothing protected renders until an active agent profile has loaded.
 * (The real enforcement is Firestore's security rules; this is the UI gate.)
 */
export default function RequireAuth({
  children,
  role,
  redirectTo = '/admin/login',
}: RequireAuthProps) {
  const router = useRouter();
  const { agent, loading } = useAuth();
  const allowed = Boolean(agent) && (!role || agent?.role === role || agent?.role === 'admin');

  useEffect(() => {
    if (!loading && !agent) router.replace(redirectTo);
  }, [loading, agent, router, redirectTo]);

  if (loading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#515154]">
        Loading…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#515154]">
        You don’t have permission to view this page.
      </div>
    );
  }

  return <>{children}</>;
}
