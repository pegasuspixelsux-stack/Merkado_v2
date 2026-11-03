import type { Category, PropertyOperation, PropertyStatus } from '../types/firestore';

const LOCALE = 'es-UY';

export function formatMoney(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      // whole amounts stay compact (US$ 14), fractional ones keep cents (US$ 4,50)
      minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString(LOCALE)}`;
  }
}

/** "USD $250.000" / "UYU $10.200.000": currency code plus a $-prefixed amount. */
export function formatPriceWithCode(price: number, currency: string): string {
  return `${currency} $${Math.round(price).toLocaleString(LOCALE)}`;
}

export const operationLabels: Record<PropertyOperation, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
  seasonal: 'Temporada',
};

export const typeLabels: Record<string, string> = {
  fruit: 'Frutas',
  vegetable: 'Verduras',
  leafy: 'Hojas verdes',
  tropical: 'Tropicales',
};

/** Stored values (kept in English so existing data keeps working). */
export const weightUnits = ['kg', 'g', 'lb', 'oz', 'each', 'dozen', 'bunch', 'case'] as const;

/** How each unit is shown to people. */
export const unitLabels: Record<string, string> = {
  kg: 'kg',
  g: 'g',
  lb: 'lb',
  oz: 'oz',
  each: 'unidad',
  dozen: 'docena',
  bunch: 'atado',
  case: 'cajón',
};

export const unitLabel = (unit?: string) => (unit ? (unitLabels[unit] ?? unit) : '');

/** "12 lb", "2,5 kg": a weight with its unit, in the local number format. */
export function formatQuantity(weight?: number, unit?: string): string {
  if (!weight) return '';
  return `${weight.toLocaleString(LOCALE)} ${unitLabel(unit)}`.trim();
}

/** Built-ins first, then the custom categories (A-Z). */
export function mergeCategories(custom: { id: string; name: string }[]): Category[] {
  const builtin = Object.entries(typeLabels).map(([id, name]) => ({ id, name, builtin: true }));
  const extra = custom
    .filter((c) => !(c.id in typeLabels))
    .sort((a, b) => a.name.localeCompare(b.name, LOCALE));
  return [...builtin, ...extra];
}

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  agent: 'Agente',
};

export const statusLabels: Record<PropertyStatus, string> = {
  active: 'Activo',
  reserved: 'Reservado',
  sold: 'Vendido',
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
  if (seconds < 60) return 'recién';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(ms).toLocaleDateString(LOCALE);
}
