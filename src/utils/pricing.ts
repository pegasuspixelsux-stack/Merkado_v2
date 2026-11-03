import type { PriceLevel } from '../types/firestore';
import type { HomeProperty } from '../lib/homeData';
import { formatMoney } from './format';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type LevelAdjustments = Pick<PriceLevel, 'categoryAdjustments'>;

/**
 * Price of one unit for a client on a price level:
 * listPrice × (1 + adjustment% / 100), where the adjustment is the level's percentage for the item's category
 * (0 when the level has none). Rounded to 2 decimals. Without a level the list price is returned.
 */
export function calculateClientItemPrice(
  item: { listPrice: number; categoryId?: string },
  clientPriceLevel?: LevelAdjustments | null,
): number {
  const pct = (item.categoryId && clientPriceLevel?.categoryAdjustments?.[item.categoryId]) || 0;
  return Math.max(0, round2(item.listPrice * (1 + pct / 100)));
}

/**
 * What a level client pays: the level price, unless the item is on sale for less
 * (a client never pays more than the sale price).
 */
export function levelUnitPrice(
  item: { listPrice: number; salePrice?: number; categoryId?: string },
  level: LevelAdjustments,
): { tier: number; unit: number; onSale: boolean } {
  const tier = calculateClientItemPrice(item, level);
  if (item.salePrice !== undefined && item.salePrice < tier) return { tier, unit: item.salePrice, onSale: true };
  return { tier, unit: tier, onSale: false };
}

/** Catalog items with the client's level prices; with no level (or no list price known) they are unchanged. */
export function applyLevel(items: HomeProperty[], level: LevelAdjustments | null): HomeProperty[] {
  if (!level) return items;
  return items.map((p) => {
    if (p.listPrice === undefined) return p;
    const { tier, unit, onSale } = levelUnitPrice(
      { listPrice: p.listPrice, salePrice: p.salePrice ? p.unitPrice : undefined, categoryId: p.type },
      level,
    );
    return {
      ...p,
      price: formatMoney(tier, 'USD'),
      salePrice: onSale ? formatMoney(unit, 'USD') : undefined,
      unitPrice: unit,
    };
  });
}
