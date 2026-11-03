import type { Category, PropertyInput } from '../types/firestore';
import { weightUnits } from './format';

export const IMPORT_COLUMNS = [
  'Title',
  'Description',
  'Weight',
  'Unit',
  'Price',
  'Category',
  'In stock',
  'Sale price',
  'Image URL',
] as const;

export interface ImportRowError {
  /** Spreadsheet row number (header = 1). */
  row: number;
  message: string;
}

export interface ParsedImport {
  items: Omit<PropertyInput, 'agentId' | 'agentName' | 'agentPhone'>[];
  errors: ImportRowError[];
  /** Category names in the sheet that do not exist yet; they are created on import. */
  newCategories: Category[];
}

const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const slug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = text(v).replace(/[$,\s]/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStock(v: unknown): boolean | null {
  const s = norm(v);
  if (s === '' || ['yes', 'y', 'true', '1', 'instock', 'si'].includes(s)) return true;
  if (['no', 'n', 'false', '0', 'outofstock'].includes(s)) return false;
  return null;
}

/** Turns the rows of a sheet (first row = headers) into items, collecting a message per bad row. */
export function parseItemRows(data: unknown[][], existing: Category[]): ParsedImport {
  const result: ParsedImport = { items: [], errors: [], newCategories: [] };
  if (data.length === 0) {
    result.errors.push({ row: 1, message: 'The sheet is empty.' });
    return result;
  }

  const headers = data[0].map(norm);
  const col = (name: string) => headers.indexOf(norm(name));
  const idx = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, col(c)])) as Record<(typeof IMPORT_COLUMNS)[number], number>;

  const missing = (['Title', 'Description', 'Weight', 'Unit', 'Price', 'Category'] as const).filter((c) => idx[c] < 0);
  if (missing.length) {
    result.errors.push({ row: 1, message: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.` });
    return result;
  }

  const known = new Map<string, Category>();
  for (const c of existing) {
    known.set(c.id, c);
    known.set(c.name.toLowerCase(), c);
  }
  const created = new Map<string, Category>();
  const cell = (row: unknown[], name: (typeof IMPORT_COLUMNS)[number]) => (idx[name] < 0 ? undefined : row[idx[name]]);

  data.slice(1).forEach((row, i) => {
    const rowNumber = i + 2;
    if (row.every((v) => text(v) === '')) return; // blank line
    const fail = (message: string) => result.errors.push({ row: rowNumber, message });

    const title = text(cell(row, 'Title'));
    const description = text(cell(row, 'Description'));
    const weight = toNumber(cell(row, 'Weight'));
    const unit = text(cell(row, 'Unit')).toLowerCase();
    const price = toNumber(cell(row, 'Price'));
    const categoryName = text(cell(row, 'Category'));
    const inStock = toStock(cell(row, 'In stock'));
    const saleRaw = cell(row, 'Sale price');
    const salePrice = text(saleRaw) === '' ? undefined : toNumber(saleRaw);
    const image = text(cell(row, 'Image URL'));

    if (!title) return fail('Title is required.');
    if (!description) return fail('Description is required.');
    if (weight === null || weight <= 0) return fail('Weight must be a number greater than 0.');
    if (!(weightUnits as readonly string[]).includes(unit)) return fail(`Unit must be one of: ${weightUnits.join(', ')}.`);
    if (price === null || price < 0) return fail('Price must be a number.');
    if (!categoryName) return fail('Category is required.');
    if (inStock === null) return fail('In stock must be yes or no.');
    if (salePrice === null) return fail('Sale price must be a number.');
    if (salePrice !== undefined && salePrice >= price) return fail('Sale price must be lower than Price.');
    if (image && !/^https?:\/\//i.test(image)) return fail('Image URL must start with http:// or https://.');

    let category = known.get(categoryName.toLowerCase()) ?? known.get(slug(categoryName));
    if (!category) {
      const id = slug(categoryName);
      if (!id) return fail('Category name has no usable letters or digits.');
      category = created.get(id) ?? { id, name: categoryName };
      created.set(id, category);
    }

    result.items.push({
      title,
      description,
      type: category.id,
      weight,
      unit,
      price,
      inStock,
      salePrice,
      photos: image ? [{ url: image }] : [],
      operation: 'sale',
      currency: 'USD',
      status: 'active',
      featured: false,
      location: { city: '', country: '' },
      specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
    });
  });

  result.newCategories = [...created.values()];
  if (result.items.length === 0 && result.errors.length === 0) {
    result.errors.push({ row: 2, message: 'No item rows found under the header.' });
  }
  return result;
}
