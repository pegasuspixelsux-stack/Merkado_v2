import type { Category, PropertyInput } from '../types/firestore';
import { weightUnits } from './format';

/** Column headers of the Excel sample, in order (Spanish). English headers are accepted too. */
export const IMPORT_COLUMNS = [
  'Título',
  'Descripción',
  'Peso',
  'Unidad',
  'Precio minorista',
  'Categoría',
  'En stock',
  'Precio de oferta',
  'Precio mayorista',
  'URL de imagen',
] as const;

type Field =
  | 'title'
  | 'description'
  | 'weight'
  | 'unit'
  | 'price'
  | 'category'
  | 'inStock'
  | 'salePrice'
  | 'wholesalePrice'
  | 'image';

/** Header names (after normalising) that map to each field. */
const HEADERS: Record<Field, string[]> = {
  title: ['Título', 'Titulo', 'Nombre', 'Title', 'Name'],
  description: ['Descripción', 'Descripcion', 'Description'],
  weight: ['Peso', 'Cantidad', 'Weight'],
  unit: ['Unidad', 'Unit'],
  price: ['Precio minorista', 'Precio', 'Price', 'Retail price'],
  category: ['Categoría', 'Categoria', 'Category'],
  inStock: ['En stock', 'Stock', 'In stock'],
  salePrice: ['Precio de oferta', 'Precio oferta', 'Oferta', 'Sale price'],
  wholesalePrice: ['Precio mayorista', 'Wholesale price'],
  image: ['URL de imagen', 'Imagen', 'Image URL', 'Image'],
};

const REQUIRED: { field: Field; label: string }[] = [
  { field: 'title', label: 'Título' },
  { field: 'description', label: 'Descripción' },
  { field: 'weight', label: 'Peso' },
  { field: 'unit', label: 'Unidad' },
  { field: 'price', label: 'Precio minorista' },
  { field: 'category', label: 'Categoría' },
];

/** Spanish names for the units (stored values stay English). */
const UNIT_ALIASES: Record<string, string> = {
  unidad: 'each',
  unidades: 'each',
  docena: 'dozen',
  docenas: 'dozen',
  atado: 'bunch',
  atados: 'bunch',
  cajon: 'case',
  caja: 'case',
};

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

// Lower-case, no accents, letters and digits only: "Categoría " -> "categoria".
const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  // Accept "4,50" and "4.50", with or without "$" / "US$".
  const s = text(v).replace(/us\$|\$|\s/gi, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStock(v: unknown): boolean | null {
  const s = norm(v);
  if (s === '' || ['si', 'yes', 'y', 's', 'true', '1', 'enstock', 'instock'].includes(s)) return true;
  if (['no', 'n', 'false', '0', 'sinstock', 'agotado', 'outofstock'].includes(s)) return false;
  return null;
}

/** Turns the rows of a sheet (first row = headers) into items, collecting a message per bad row. */
export function parseItemRows(data: unknown[][], existing: Category[]): ParsedImport {
  const result: ParsedImport = { items: [], errors: [], newCategories: [] };
  if (data.length === 0) {
    result.errors.push({ row: 1, message: 'La hoja está vacía.' });
    return result;
  }

  const headers = data[0].map(norm);
  const col = {} as Record<Field, number>;
  (Object.keys(HEADERS) as Field[]).forEach((f) => {
    col[f] = headers.findIndex((h) => HEADERS[f].some((name) => norm(name) === h));
  });

  const missing = REQUIRED.filter((r) => col[r.field] < 0).map((r) => r.label);
  if (missing.length) {
    result.errors.push({ row: 1, message: `Falta${missing.length > 1 ? 'n las columnas' : ' la columna'}: ${missing.join(', ')}.` });
    return result;
  }

  const known = new Map<string, Category>();
  for (const c of existing) {
    known.set(c.id, c);
    known.set(norm(c.name), c);
  }
  const created = new Map<string, Category>();
  const cell = (row: unknown[], f: Field) => (col[f] < 0 ? undefined : row[col[f]]);
  const units = weightUnits as readonly string[];

  data.slice(1).forEach((row, i) => {
    const rowNumber = i + 2;
    if (row.every((v) => text(v) === '')) return; // blank line
    const fail = (message: string) => result.errors.push({ row: rowNumber, message });

    const title = text(cell(row, 'title'));
    const description = text(cell(row, 'description'));
    const weight = toNumber(cell(row, 'weight'));
    const unitRaw = norm(cell(row, 'unit'));
    const unit = UNIT_ALIASES[unitRaw] ?? unitRaw;
    const price = toNumber(cell(row, 'price'));
    const categoryName = text(cell(row, 'category'));
    const inStock = toStock(cell(row, 'inStock'));
    const saleRaw = cell(row, 'salePrice');
    const salePrice = text(saleRaw) === '' ? undefined : toNumber(saleRaw);
    const wholesaleRaw = cell(row, 'wholesalePrice');
    const wholesalePrice = text(wholesaleRaw) === '' ? undefined : toNumber(wholesaleRaw);
    const image = text(cell(row, 'image'));

    if (!title) return fail('Falta el título.');
    if (!description) return fail('Falta la descripción.');
    if (weight === null || weight <= 0) return fail('El peso debe ser un número mayor a 0.');
    if (!units.includes(unit)) return fail(`La unidad debe ser una de: ${units.join(', ')}, unidad, docena, atado, cajón.`);
    if (price === null || price < 0) return fail('El precio debe ser un número.');
    if (!categoryName) return fail('Falta la categoría.');
    if (inStock === null) return fail('"En stock" debe ser sí o no.');
    if (salePrice === null) return fail('El precio de oferta debe ser un número.');
    if (salePrice !== undefined && salePrice >= price) return fail('El precio de oferta debe ser menor al precio minorista.');
    if (wholesalePrice === null) return fail('El precio mayorista debe ser un número.');
    if (wholesalePrice !== undefined && wholesalePrice > price) return fail('El precio mayorista no puede ser mayor al minorista.');
    if (image && !/^https?:\/\//i.test(image)) return fail('La URL de imagen debe empezar con http:// o https://.');

    let category = known.get(norm(categoryName)) ?? known.get(slug(categoryName));
    if (!category) {
      const id = slug(categoryName);
      if (!id) return fail('El nombre de la categoría no tiene letras ni números.');
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
      wholesalePrice,
      inStock,
      salePrice,
      photos: image ? [{ url: image }] : [],
      operation: 'sale',
      currency: 'UYU',
      status: 'active',
      featured: false,
      location: { city: '', country: '' },
      specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
    });
  });

  result.newCategories = [...created.values()];
  if (result.items.length === 0 && result.errors.length === 0) {
    result.errors.push({ row: 2, message: 'No se encontraron filas de artículos debajo del encabezado.' });
  }
  return result;
}
