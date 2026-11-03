import { cache } from 'react';
import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProperty, getSimilarProperties } from '@/src/services/dbService';
import type { Property } from '@/src/types/firestore';
import { formatPriceWithCode, operationLabels, typeLabels } from '@/src/utils/format';
import { IK, ikUrl } from '@/src/utils/imagekit';
import PropertyGallery from '@/src/components/PropertyGallery';
import PropertySpecs from '@/src/components/PropertySpecs';
import PropertyContactCard from '@/src/components/PropertyContactCard';
import { PublicHeader } from '@/src/components/PublicChrome';
import SimilarProperties from '@/src/components/SimilarProperties';
import SiteFooter from '@/src/components/SiteFooter';

type Props = { params: Promise<{ id: string }> };

// Shared by generateMetadata and the page so the property is only fetched once per request.
// Only `active` properties are publicly readable: Firestore rejects reads of anything else,
// which we treat the same as "not found".
const loadProperty = cache(async (id: string): Promise<Property | null> => {
  try {
    const property = await getProperty(id);
    return property && property.status === 'active' ? property : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await loadProperty(id);
  if (!property) {
    return { title: 'Property not found | Coastal Web', robots: { index: false, follow: false } };
  }

  const place = [property.location.neighborhood, property.location.city].filter(Boolean).join(', ');
  const price = formatPriceWithCode(property.price, property.currency);
  const title = `${property.title} | ${price}`;
  const description =
    `${operationLabels[property.operation]} · ${typeLabels[property.type]} in ${place}. ` +
    `${property.specs.bedrooms} bed, ${property.specs.bathrooms} bath, ${property.specs.areaM2} m².`;
  const image = property.photos[0] ? ikUrl(property.photos[0].url, IK.og) : undefined;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: 'Coastal Web',
      images: image ? [{ url: image, width: 1200, height: 630, alt: property.title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await loadProperty(id);
  if (!property) notFound();

  // A failure here must never break the page, so fall back to no suggestions.
  const similar = await getSimilarProperties(property).catch(() => []);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">
      <PublicHeader />

      <PropertyGallery photos={property.photos} title={property.title}>
        <p className="flex flex-wrap items-center gap-x-2 text-white/80 text-sm font-medium tracking-wide uppercase mb-3">
          <MapPin className="w-4 h-4" />
          <span>{[property.location.neighborhood, property.location.city].filter(Boolean).join(', ') || property.location.country}</span>
          <span aria-hidden="true" className="text-white/40">·</span>
          <span className="text-white">{formatPriceWithCode(property.price, property.currency)}</span>
        </p>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">{property.title}</h1>
      </PropertyGallery>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-2 space-y-10 min-w-0">
            <PropertySpecs property={property} showHeader={false} />

            {property.description && (
              <section aria-label="About this property">
                <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-4">About this property</h2>
                <p className="text-[#515154] font-light leading-relaxed whitespace-pre-line max-w-2xl">
                  {property.description}
                </p>
              </section>
            )}
          </div>

          <PropertyContactCard property={property} />
        </div>
      </main>

      <SimilarProperties properties={similar} />

      <SiteFooter />
    </div>
  );
}
