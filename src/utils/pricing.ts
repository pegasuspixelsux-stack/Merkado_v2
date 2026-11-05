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
  /** Units (or atados) per box. */
  boxUnits?: number;
  /** Exception: the item may also be ordered loose. */
  looseAllowed?: boolean;
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
 * Retail customers get kilo or unidad. Wholesale customers order BOXES; they only also get loose units
 * (unidad) when the item is marked "se puede pedir suelto" or the client has that exception.
 * An item that has no box information offers just its base unit (it cannot be forced into a box).
 */
export function saleOptions(
  src: SaleSource,
  audience: 'retail' | 'wholesale',
  opts: { allowLoose?: boolean } = {},
): SaleOption[] {
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

  // Units per box: the box and the unit price follow from each other (a bunch counts as a unit).
  const bu = src.boxUnits && src.boxUnits >= 1 ? src.boxUnits : undefined;
  if (bu) {
    if (!all.por_unidad && base === 'por_caja') {
      all.por_unidad = { mode: 'por_unidad', price: round2(src.price / bu), salePrice: src.salePrice === undefined ? undefined : round2(src.salePrice / bu) };
    }
    if (!all.por_caja && (base === 'por_unidad' || base === 'por_atado')) {
      all.por_caja = { mode: 'por_caja', price: round2(src.price * bu), salePrice: src.salePrice === undefined ? undefined : round2(src.salePrice * bu) };
    }
  }

  if (audience === 'wholesale' && all.por_caja) {
    const loose = src.looseAllowed || opts.allowLoose;
    const looseOption = all.por_unidad ?? (base !== 'por_caja' ? all[base] : undefined);
    return loose && looseOption ? [all.por_caja, looseOption] : [all.por_caja];
  }

  const wanted: PricingMode[] = audience === 'wholesale' ? ['por_caja', 'por_unidad'] : ['por_kilo', 'por_unidad'];
  const picked = wanted.map((m) => all[m]).filter((o): o is SaleOption => !!o);
  return picked.length ? picked : [all[base] as SaleOption];
}

/** "Caja de 12 unidades · 6 kg" (empty when the item has no box information). */
export function boxDescription(src: Pick<SaleSource, 'pricingMode' | 'boxUnits' | 'boxWeight'>): string {
  const noun = src.pricingMode === 'por_atado' ? 'atados' : 'unidades';
  const parts = [
    src.boxUnits ? `${src.boxUnits} ${src.boxUnits === 1 ? noun.slice(0, -1) : noun}` : '',
    src.boxWeight ? `${String(src.boxWeight).replace('.', ',')} kg` : '',
  ].filter(Boolean);
  return parts.length ? `Caja de ${parts.join(' · ')}` : '';
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

/**
 * Wholesale clients order boxes: items that have box information are shown (and added to the cart) per box,
 * at the client's level price. `allowLoose` is the client-level exception (they may also order loose).
 * Items without box information keep their own unit.
 */
export function applyBoxFirst(items: HomeProperty[], level: LevelAdjustments | null, allowLoose = false): HomeProperty[] {
  if (!level) return items;
  return items.map((p) => {
    if (p.listPrice === undefined || !p.sale) return p;
    const options = saleOptions(
      {
        price: p.listPrice,
        salePrice: p.sale.salePrice,
        pricingMode: p.pricingMode,
        boxWeight: p.sale.boxWeight,
        unitWeight: p.sale.unitWeight,
        boxPrice: p.sale.boxPrice,
        unitPrice: p.sale.manualUnitPrice,
        boxUnits: p.sale.boxUnits,
        looseAllowed: p.sale.looseAllowed,
      },
      'wholesale',
      { allowLoose },
    );
    const box = options[0];
    if (!box || box.mode !== 'por_caja') return p;
    const { unit, was } = optionPrice(box, p.type, level);
    return {
      ...p,
      pricingMode: 'por_caja',
      price: withUnitSuffix(formatMoney(was ?? unit), 'por_caja'),
      salePrice: was !== undefined ? withUnitSuffix(formatMoney(unit), 'por_caja') : undefined,
      unitPrice: unit,
      listPrice: box.price,
      area: boxDescription({ pricingMode: p.pricingMode, boxUnits: p.sale.boxUnits, boxWeight: p.sale.boxWeight }) || p.area,
    };
  });
}
