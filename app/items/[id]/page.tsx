import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveProperties, getCategories, getProperty } from '@/src/services/dbService';
import { sampleProperties } from '@/src/data/sampleProperties';
import type { Property } from '@/src/types/firestore';
import { formatMoney, formatQuantity, mergeCategories, withUnitSuffix } from '@/src/utils/format';
import BuyBox from '@/src/components/BuyBox';
import ItemPriceView from '@/src/components/ItemPriceView';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import SimilarItems, { type SimilarItem } from '@/src/components/SimilarItems';
import PropertyImage from '@/src/components/PropertyImage';
import SiteFooter from '@/src/components/SiteFooter';
import BrandName from '@/src/components/BrandName';

type Props = { params: Promise<{ id: string }> };

// One Firestore read shared by generateMetadata and the page.
const loadItem = cache(async (id: string): Promise<Property | null> => {
  // The built-in samples shown before any item exists: /items/sample-3 is the third sample.
  const sampleIndex = /^sample-(\d+)$/.exec(id)?.[1];
  if (sampleIndex) {
    const sample = sampleProperties[Number(sampleIndex) - 1];
    return sample ? { ...sample, id, agentId: '', createdAt: 0, updatedAt: 0 } : null;
  }
  try {
    const item = await getProperty(id);
    return item && item.status === 'active' ? item : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await loadItem(id);
  if (!item) return { title: 'Artículo no encontrado | Merkado', robots: { index: false, follow: false } };
  return {
    title: `${item.title} | Merkado`,
    description: item.description.slice(0, 160),
    openGraph: { title: item.title, description: item.description.slice(0, 160), images: item.photos[0] ? [item.photos[0].url] : [] },
  };
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await loadItem(id);
  if (!item) notFound();

  const custom = await getCategories().catch(() => []);
  const category = mergeCategories(custom).find((c) => c.id === item.type)?.name ?? item.type;
  const isSample = id.startsWith('sample-');
  const inStock = item.inStock !== false;
  const quantity = formatQuantity(item.weight, item.unit);
  const photo = item.photos[0]?.url;
  const pricing = {
    price: item.price,
    salePrice: item.salePrice,
    pricingMode: item.pricingMode,
    boxWeight: item.boxWeight,
    unitWeight: item.unitWeight,
    boxPrice: item.boxPrice,
    unitPrice: item.unitPrice,
    boxUnits: item.boxUnits,
    looseAllowed: item.looseAllowed,
  };

  // Other items to browse: same category first, then the rest (at most 10).
  // Which items customers order together can't be shown here: orders are private to staff.
  const pool: Property[] = isSample
    ? sampleProperties.map((p, i) => ({ ...p, id: `sample-${i + 1}`, agentId: '', createdAt: 0, updatedAt: 0 }))
    : await getActiveProperties().catch(() => []);
  const others = pool.filter((p) => p.id !== item.id);
  const similar: SimilarItem[] = [...others.filter((p) => p.type === item.type), ...others.filter((p) => p.type !== item.type)]
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      title: p.title,
      image: p.photos[0]?.url ?? '',
      price: withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode),
      salePrice: p.salePrice === undefined ? undefined : withUnitSuffix(formatMoney(p.salePrice, p.currency), p.pricingMode),
      quantity: formatQuantity(p.weight, p.unit),
      inStock: p.inStock !== false,
    }));

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      <header className="border-b border-[#000000]/5 bg-[#FBFBFD]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight"><BrandName /></Link>
          <SiteNavLinks />
          <div className="flex items-center gap-3">
            <WholesaleAccess />
            <MobileNavMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA]">
          {photo && (
            <PropertyImage
              src={photo}
              alt={item.title}
              variant="gallery"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              className={`object-cover ${inStock ? '' : 'opacity-50 grayscale'}`}
            />
          )}
          {!isSample && <FavoriteButton productId={String(item.id)} title={item.title} className="absolute top-4 right-4 w-10 h-10 z-10" />}
          {!inStock && (
            <span className="absolute top-4 left-4 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Sin stock
            </span>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#515154] font-semibold">{category}</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{item.title}</h1>
            <ItemPriceView categoryId={item.type} pricing={pricing} />
            {quantity && (
              <p className="text-sm text-[#515154]">
                <span className="font-medium text-[#1D1D1F]">Peso:</span> {quantity}
              </p>
            )}
            <p className="text-sm text-[#515154]">
              <span className="font-medium text-[#1D1D1F]">Entrega en:</span>{' '}
              {(item.deliveryAreas?.length ? item.deliveryAreas : ['Maldonado']).join(', ')}
            </p>
            {item.description && (
              <p className="text-[#515154] font-light leading-relaxed whitespace-pre-line">{item.description}</p>
            )}
          </div>

          <BuyBox
            itemId={isSample ? '' : item.id}
            title={item.title}
            pricing={pricing}
            categoryId={item.type}
            inStock={inStock}
          />
        </div>
      </main>

      <SimilarItems title="También te puede gustar" items={similar} />

      <SiteFooter />
    </div>
  );
}
