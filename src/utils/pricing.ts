import type { PriceLevel, PricingMode } from '../types/firestore';
import type { HomeProperty } from '../lib/homeData';
import { formatMoney, withUnitSuffix } from './format';

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

/** The fields of an item that decide which selling units it has and what each costs. */
export interface SaleSource {
  price: number;
  salePrice?: number;
  pricingMode?: PricingMode;
  boxWeight?: number;
  unitWeight?: number;
  boxPrice?: number;
  unitPrice?: number;
}

/** One way to buy an item: the unit and its list (and sale) price. */
export interface SaleOption {
  mode: PricingMode;
  price: number;
  salePrice?: number;
}

/**
 * The units an item can be bought in. `price` is per the item's base unit (`pricingMode`);
 * the other units are worked out from it with the box / unit weight, unless a manual price is set.
 * Retail customers get kilo or unidad; wholesale customers get caja or unidad.
 * An item that cannot offer those (no weights, or sold por atado / bolsón) offers just its base unit.
 */
export function saleOptions(src: SaleSource, audience: 'retail' | 'wholesale'): SaleOption[] {
  const base: PricingMode = src.pricingMode ?? 'por_kilo';
  const bw = src.boxWeight && src.boxWeight > 0 ? src.boxWeight : undefined;
  const uw = src.unitWeight && src.unitWeight > 0 ? src.unitWeight : undefined;

  // price per kilo, when it can be worked out from the base unit
  const divisor = base === 'por_caja' ? bw : base === 'por_unidad' ? uw : base === 'por_kilo' ? 1 : undefined;
  const perKg = divisor
    ? { list: src.price / divisor, sale: src.salePrice === undefined ? undefined : src.salePrice / divisor }
    : null;
  const scaled = (w?: number): SaleOption | null =>
    perKg && w
      ? {
          mode: 'por_kilo',
          price: round2(perKg.list * w),
          salePrice: perKg.sale === undefined ? undefined : round2(perKg.sale * w),
        }
      : null;

  const all: Partial<Record<PricingMode, SaleOption>> = { [base]: { mode: base, price: src.price, salePrice: src.salePrice } };
  if (!all.por_kilo && perKg) {
    all.por_kilo = { mode: 'por_kilo', price: round2(perKg.list), salePrice: perKg.sale === undefined ? undefined : round2(perKg.sale) };
  }
  if (!all.por_caja) {
    const s = scaled(bw);
    if (src.boxPrice !== undefined) all.por_caja = { mode: 'por_caja', price: src.boxPrice };
    else if (s) all.por_caja = { ...s, mode: 'por_caja' };
  }
  if (!all.por_unidad) {
    const s = scaled(uw);
    if (src.unitPrice !== undefined) all.por_unidad = { mode: 'por_unidad', price: src.unitPrice };
    else if (s) all.por_unidad = { ...s, mode: 'por_unidad' };
  }

  const wanted: PricingMode[] = audience === 'wholesale' ? ['por_caja', 'por_unidad'] : ['por_kilo', 'por_unidad'];
  const picked = wanted.map((m) => all[m]).filter((o): o is SaleOption => !!o);
  return picked.length ? picked : [all[base] as SaleOption];
}

/** What the customer pays for one option (their level's price, or the sale / list price) and the price it replaces. */
export function optionPrice(
  option: SaleOption,
  categoryId: string | undefined,
  level: LevelAdjustments | null | undefined,
): { unit: number; was?: number } {
  if (level) {
    const r = levelUnitPrice({ listPrice: option.price, salePrice: option.salePrice, categoryId }, level);
    return { unit: r.unit, was: r.onSale ? r.tier : r.unit !== option.price ? option.price : undefined };
  }
  return { unit: option.salePrice ?? option.price, was: option.salePrice !== undefined ? option.price : undefined };
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
      price: withUnitSuffix(formatMoney(tier), p.pricingMode),
      salePrice: onSale ? withUnitSuffix(formatMoney(unit), p.pricingMode) : undefined,
      unitPrice: unit,
    };
  });
}
