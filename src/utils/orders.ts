import type { Lead, LeadStatus } from '../types/firestore';

/** An order: every product line the customer sent together (the cart saves one lead per product). */
export interface OrderGroup {
  key: string;
  lines: Lead[];
  /** The line used for shared data (customer, delivery details, date): the oldest id, so it never changes. */
  primary: Lead;
  status: LeadStatus;
  createdAt: number;
}

/**
 * Orders carry a shared `orderId`. Older ones do not, so they are grouped by what the cart wrote:
 * same moment, same customer and phone.
 */
export const orderKey = (l: Lead) =>
  l.orderId || `legacy|${l.createdAt}|${l.clientName}|${l.phone}|${l.clientId ?? ''}`;

/** Least advanced status wins: an order is "new" until every line has been accepted. */
function statusOf(lines: Lead[]): LeadStatus {
  if (lines.some((l) => l.status === 'new')) return 'new';
  if (lines.some((l) => l.status === 'contacted')) return 'contacted';
  return 'closed';
}

/** Newest order first; keeps the order of `leads` (already newest first). */
export function groupOrders(leads: Lead[]): OrderGroup[] {
  const map = new Map<string, Lead[]>();
  for (const l of leads) {
    const k = orderKey(l);
    const arr = map.get(k);
    if (arr) arr.push(l);
    else map.set(k, [l]);
  }
  return [...map.entries()].map(([key, lines]) => {
    const sorted = [...lines].sort((a, b) => a.id.localeCompare(b.id));
    return { key, lines: sorted, primary: sorted[0], status: statusOf(sorted), createdAt: Math.max(...sorted.map((l) => l.createdAt)) };
  });
}

/**
 * The list is cut at `limit` newest records, so the oldest order may be missing lines.
 * Drop it instead of showing a partial order.
 */
export function withoutPartialOrder(leads: Lead[], limit: number): Lead[] {
  if (leads.length < limit || leads.length === 0) return leads;
  const cut = orderKey(leads[leads.length - 1]);
  return leads.filter((l) => orderKey(l) !== cut);
}

export const orderTotal = (lines: Lead[]) =>
  lines.reduce((s, l) => s + (l.quantity ?? 0) * (l.unitPrice ?? 0), 0);

/** Order number shown in the list and printed on the pick slip, e.g. MK-20261105-AB12. */
export function orderNumberOf(group: OrderGroup): string {
  const l = group.primary;
  const d = l.createdAt ? new Date(l.createdAt) : new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MK-${ymd}-${(l.orderId || l.id).slice(0, 4).toUpperCase()}`;
}
