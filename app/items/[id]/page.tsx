import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getActiveProperties, getCategories, getProperty } from '@/src/services/dbService';
import { sampleProperties } from '@/src/data/sampleProperties';
import type { Property } from '@/src/types/firestore';
import { formatMoney, mergeCategories } from '@/src/utils/format';
import BuyBox from '@/src/components/BuyBox';
import SimilarItems, { type SimilarItem } from '@/src/components/SimilarItems';
import PropertyImage from '@/src/components/PropertyImage';
import SiteFooter from '@/src/components/SiteFooter';

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
  if (!item) return { title: 'Item not found | Merkado', robots: { index: false, follow: false } };
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

  const onSale = item.salePrice !== undefined;
  const retailPrice = item.salePrice ?? item.price;
  const isSample = id.startsWith('sample-');
  const inStock = item.inStock !== false;
  const quantity = item.weight ? `${item.weight.toLocaleString('en-US')} ${item.unit ?? ''}`.trim() : '';
  const photo = item.photos[0]?.url;

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
      price: formatMoney(p.price, p.currency),
      salePrice: p.salePrice === undefined ? undefined : formatMoney(p.salePrice, p.currency),
      quantity: p.weight ? `${p.weight.toLocaleString('en-US')} ${p.unit ?? ''}`.trim() : '',
      inStock: p.inStock !== false,
    }));

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      <header className="border-b border-[#000000]/5 bg-[#FBFBFD]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight">Merkado.</Link>
          <Link href="/#properties" className="inline-flex items-center gap-2 text-sm text-[#515154] hover:text-[#1D1D1F] transition-colors">
            <ArrowLeft className="w-4 h-4" /> All items
          </Link>
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
          {!inStock && (
            <span className="absolute top-4 left-4 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Out of stock
            </span>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#515154] font-semibold">{category}</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{item.title}</h1>
            <dl className="grid grid-cols-2 gap-3 max-w-md">
              <div className="rounded-2xl bg-white border border-[#000000]/5 p-4">
                <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Minorista</dt>
                <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-2xl font-semibold">{formatMoney(retailPrice, item.currency)}</span>
                  {onSale && <s className="text-sm text-[#86868B]">{formatMoney(item.price, item.currency)}</s>}
                </dd>
                {onSale && <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Sale</span>}
              </div>
              <div className="rounded-2xl bg-white border border-[#000000]/5 p-4">
                <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold">Mayorista</dt>
                <dd className="mt-1">
                  {item.wholesalePrice !== undefined ? (
                    <span className="text-2xl font-semibold">{formatMoney(item.wholesalePrice, item.currency)}</span>
                  ) : (
                    <span className="text-sm text-[#515154]">Ask us for a quote</span>
                  )}
                </dd>
                <Link href="/#contact" className="inline-block mt-2 text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
                  Get wholesale prices
                </Link>
              </div>
            </dl>
            {quantity && (
              <p className="text-sm text-[#515154]">
                <span className="font-medium text-[#1D1D1F]">Quantity:</span> {quantity} per unit
              </p>
            )}
            {item.description && (
              <p className="text-[#515154] font-light leading-relaxed whitespace-pre-line">{item.description}</p>
            )}
          </div>

          <BuyBox
            itemId={isSample ? '' : item.id}
            title={item.title}
            retailPrice={retailPrice}
            wholesalePrice={item.wholesalePrice}
            unitLabel={quantity}
            inStock={inStock}
          />
        </div>
      </main>

      <SimilarItems title="Customers also like" items={similar} />

      <SiteFooter />
    </div>
  );
}
