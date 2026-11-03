import type { PropertyOperation, PropertyStatus, PropertyType } from '../types/firestore';

export function formatMoney(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString('en-US')}`;
  }
}

/** "USD $250,000" / "UYU $10,200,000": currency code plus a $-prefixed amount. */
export function formatPriceWithCode(price: number, currency: string): string {
  return `${currency} $${Math.round(price).toLocaleString('en-US')}`;
}

export const operationLabels: Record<PropertyOperation, string> = {
  sale: 'Sale',
  rent: 'Rent',
  seasonal: 'Seasonal',
};

export const typeLabels: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  land: 'Land',
  commercial: 'Commercial',
};

export const statusLabels: Record<PropertyStatus, string> = {
  active: 'Active',
  reserved: 'Reserved',
  sold: 'Sold',
};

/** Builds a click-to-chat link. Returns null if the number has no usable digits. */
export function whatsappUrl(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2); // 00598… -> 598…
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function timeAgo(ms: number): string {
  if (!ms) return '';
  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}
