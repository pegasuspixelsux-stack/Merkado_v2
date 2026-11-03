import type { Metadata } from 'next';
import CatalogPage from '@/src/components/CatalogPage';
import { loadHomeData, type HomeProperty } from '@/src/lib/homeData';
import { sampleProperties } from '@/src/data/sampleProperties';
import { formatMoney, formatQuantity, typeLabels } from '@/src/utils/format';

export const metadata: Metadata = {
  title: 'Todos los productos | Merkado',
  description: 'Buscá y filtrá todo el catálogo de frutas, verduras y hojas verdes de Merkado.',
};

// Same cache window as the homepage.
export const revalidate = 60;

/** The built-in samples, shown until the first real item exists (they open /items/sample-N). */
const samples: HomeProperty[] = sampleProperties.map((p, i) => ({
  id: `sample-${i + 1}`,
  title: p.title,
  location: '',
  price: formatMoney(p.price, p.currency),
  salePrice: p.salePrice === undefined ? undefined : formatMoney(p.salePrice, p.currency),
  listPrice: p.price,
  unitPrice: p.salePrice ?? p.price,
  beds: 0,
  baths: 0,
  area: formatQuantity(p.weight, p.unit),
  image: p.photos[0]?.url ?? '',
  href: `/items/sample-${i + 1}`,
  type: p.type,
  typeLabel: typeLabels[p.type as string] ?? p.type,
  inStock: p.inStock !== false,
  featured: i < 6,
}));

export default async function Page() {
  const { properties } = await loadHomeData();
  return <CatalogPage items={properties.length ? properties : samples} />;
}
