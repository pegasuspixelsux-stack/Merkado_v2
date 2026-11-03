'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bath, Bed, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import PropertyImage from './PropertyImage';
import type { Property } from '../types/firestore';
import { formatMoney } from '../utils/format';

/** Swipeable slider of related listings, shown above the footer on a property page. */
export default function SimilarProperties({ properties }: { properties: Property[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, properties.length]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (!properties.length) return null;

  return (
    <section aria-label="Similar properties" className="max-w-7xl mx-auto px-6 pb-28 md:pb-40">
      <div className="flex items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">You may also like</h2>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight">Similar properties</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label="Previous properties"
            className="w-11 h-11 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label="Next properties"
            className="w-11 h-11 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ul
        ref={track}
        onScroll={update}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((p) => (
          <li key={p.id} className="snap-start shrink-0 w-[82%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
            <Link
              href={`/properties/${p.id}`}
              aria-label={`View ${p.title}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-8 transition-transform duration-500 hover:-translate-y-1"
            >
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <PropertyImage
                  src={p.photos[0]?.url ?? ''}
                  alt={`${p.title}, ${p.location.city}`}
                  variant="card"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 82vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                <span className="bg-white/90 backdrop-blur-md text-black text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
                  {formatMoney(p.price, p.currency)}
                  {p.operation === 'rent' ? ' / mo' : ''}
                </span>
                <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <div className="relative z-10 text-white">
                <p className="text-xs text-white/70 font-medium tracking-wide uppercase mb-1">
                  {[p.location.neighborhood, p.location.city].filter(Boolean).join(', ')}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight mb-4">{p.title}</h3>
                <div className="flex items-center space-x-6 pt-4 border-t border-white/20 text-xs text-white/80 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Bed className="w-4 h-4" />
                    <span>{p.specs.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Bath className="w-4 h-4" />
                    <span>{p.specs.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Maximize className="w-4 h-4" />
                    <span>{p.specs.areaM2.toLocaleString('en-US')} m²</span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
