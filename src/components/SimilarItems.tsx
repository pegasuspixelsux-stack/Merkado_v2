'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PropertyImage from '@/src/components/PropertyImage';

export interface SimilarItem {
  id: string;
  title: string;
  image: string;
  /** Formatted regular price. */
  price: string;
  /** Formatted sale price, when on sale. */
  salePrice?: string;
  /** e.g. "12 lb". */
  quantity: string;
  inStock: boolean;
}

/** Horizontal slider of other items; swipe on touch screens, arrows on desktop. */
export default function SimilarItems({ title, items }: { title: string; items: SimilarItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section aria-label={title} className="max-w-7xl mx-auto px-6 pb-24">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button type="button" onClick={() => scroll(-1)} aria-label="Desplazar a la izquierda" className="w-10 h-10 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Desplazar a la derecha" className="w-10 h-10 rounded-full bg-white border border-[#000000]/5 flex items-center justify-center hover:bg-[#F5F5F7]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ul
        ref={track}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-6 px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="snap-start shrink-0 w-[60%] sm:w-[40%] md:w-[28%] lg:w-[22%]">
            <Link href={`/items/${item.id}`} className="group block">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA]">
                <PropertyImage
                  src={item.image}
                  alt={item.title}
                  variant="card"
                  sizes="(min-width: 1024px) 22vw, (min-width: 768px) 28vw, 60vw"
                  className={`object-cover transition-transform duration-500 group-hover:scale-105 ${item.inStock ? '' : 'opacity-50 grayscale'}`}
                />
                {!item.inStock && (
                  <span className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">Sin stock</span>
                )}
                {item.salePrice && item.inStock && (
                  <span className="absolute top-3 left-3 bg-white text-black text-[10px] font-semibold px-2.5 py-1 rounded-full">Oferta</span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-medium tracking-tight truncate">{item.title}</h3>
              <p className="text-xs text-[#515154] flex items-center gap-2">
                <span className="truncate">{item.quantity}</span>
                <span className="ml-auto shrink-0 font-semibold text-[#1D1D1F]">
                  {item.salePrice ? (
                    <>
                      <s className="font-normal text-[#86868B] mr-1.5">{item.price}</s>
                      {item.salePrice}
                    </>
                  ) : (
                    item.price
                  )}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
