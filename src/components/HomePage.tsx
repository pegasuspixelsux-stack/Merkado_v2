'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { HomeProperty } from '@/src/lib/homeData';
import type { PropertyType } from '@/src/types/firestore';
import { typeLabels } from '@/src/utils/format';
import SiteFooter from '@/src/components/SiteFooter';
import InfoSections from '@/src/components/InfoSections';
import PropertyImage from '@/src/components/PropertyImage';
import CartButton from '@/src/components/CartButton';
import { useCart } from '@/src/context/CartContext';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
import {
  ArrowUpRight,
  KeyRound,
  Search,
  ChevronLeft,
  ChevronRight,
  Square,
  LayoutGrid,
  List,
} from 'lucide-react';
import BrandName, { DEFAULT_LOGO } from '@/src/components/BrandName';
import { useBusiness } from '@/src/context/BusinessContext';

const PAGE_SIZE = 12;


const fallbackProperties: HomeProperty[] = [
  {
    id: 1,
    title: "Tomates perita",
    location: "Canelones, UY",
    price: "US$ 4,50 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 12 lb", "Calidad A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Sandía sin semillas",
    location: "Salto, UY",
    price: "US$ 6,90 c/u",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Sin transgénicos", "18 lb c/u", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Mangos Ataulfo",
    location: "Rivera, UY",
    price: "US$ 18,00 / cajón",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 10 lb", "Calidad A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Ananás dorados",
    location: "Rivera, UY",
    price: "US$ 3,80 c/u",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Convencional", "4 lb c/u", "Calidad A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Papas blancas",
    location: "San José, UY",
    price: "US$ 0,85 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Convencional", "Bolsa 50 lb", "Calidad B"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Mandarinas clementinas",
    location: "Salto, UY",
    price: "US$ 2,20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Caja 5 lb", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Mix de verduras de huerta",
    location: "Montevideo, UY",
    price: "US$ 32,00 / caja",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Caja 20 lb", "Calidad A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Mix de frutos rojos y cítricos",
    location: "Paysandú, UY",
    price: "US$ 21,00 / caja",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Sin transgénicos", "Caja 8 lb", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Hojas verdes para ensalada",
    location: "Canelones, UY",
    price: "US$ 3,20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 10 lb", "Calidad A"],
    type: 'leafy',
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
  },
];


export default function MerkadoHome({
  initialProperties = [],
}: {
  /** Active properties loaded on the server; the built-in samples show if there are none. */
  initialProperties?: HomeProperty[];
}) {
  // The built-in samples open /items/sample-N, which the item page fills from the same sample data.
  const [baseProperties] = useState<HomeProperty[]>(
    initialProperties.length
      ? initialProperties
      : fallbackProperties.map((p) => ({ ...p, href: `/items/sample-${p.id}` })),
  );
  // A customer who logged in with Acceso mayoristas sees their price level; everyone else sees list prices.
  const { client, level } = useClient();
  const { logo } = useBusiness();
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(baseProperties, level), level, allowLoose), [baseProperties, level, allowLoose]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PropertyType | 'all'>('all');
  const [page, setPage] = useState(1);
  // Phones only: one big card per row, two per row (default) or a compact list.
  const [layout, setLayout] = useState<'one' | 'two' | 'list'>('two');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('merkado-grid-layout');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the visitor's choice
      if (saved === 'one' || saved === 'two' || saved === 'list') setLayout(saved);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  }, []);
  const chooseLayout = (v: 'one' | 'two' | 'list') => {
    setLayout(v);
    try {
      localStorage.setItem('merkado-grid-layout', v);
    } catch {
      /* ignore */
    }
  };
  // Minorista (retail) / Mayorista (wholesale); sent along with the order.
  // Cart: shared with every page (see CartContext).
  const { add: addToCart, setOpen: setCartOpen } = useCart();
  // Pills: one per category that has items, in the order they first appear.
  const categories = Array.from(
    new Map(
      properties
        .filter((p) => p.type)
        .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
    ),
    ([id, label]) => ({ id, label }),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    // Searches the name, the category and the price (regular and sale, e.g. "4.5" or "$4.50").
    const matchesQuery =
      !normalizedQuery ||
      [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesCategory = category === 'all' || p.type === category;
    return matchesQuery && matchesCategory;
  });

  // 12 items per page; a filter change returns to page 1, and the page never exceeds the last one.
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProperties = filteredProperties.slice(pageStart, pageStart + PAGE_SIZE);
  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
  };
  // Page numbers to show: first, last, and the neighbours of the current page (… between gaps).
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ['gap' as const, n] : [n]));



  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">

      {/* --- NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md">
        <div className="bg-[#2E7D32] text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Precios de mercado válidos por el día</span>
          <span className="hidden md:inline lg:hidden">Precios de mercado válidos por el día. Pueden cambiar en pedidos para el día siguiente.</span>
          <span className="hidden lg:inline">Precios de mercado válidos por el día. Si el pedido es para otro día, pueden cambiar: te lo confirmamos con precios ajustados antes del envío.</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></span>
          <SiteNavLinks />
          <div className="flex items-center gap-1">
          <WholesaleAccess />
          <CartButton />
          <MobileNavMenu />
          </div>
        </div>
      </header>

      {/* --- HERO: one fixed unit (no carousel) --- */}
      <section id="search" className="px-3 md:px-6 pt-0 md:pt-2 max-w-[1440px] mx-auto">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full md:w-3/4 mx-auto bg-white rounded-2xl shadow-lg border border-[#000000]/5 p-3 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 pl-3">
            <Search className="hidden md:block w-5 h-5 text-[#515154] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscá por nombre, categoría o precio…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="min-w-0 flex-1 bg-transparent px-2 md:px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 bg-[#2E7D32] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#2E7D32]/85 transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Buscar</span>
            </button>
          </div>
        </form>
      </section>

      <div className="max-w-[1440px] mx-auto px-3 md:px-6 pt-3 md:pt-4">
        <section className="relative w-full overflow-hidden rounded-3xl border border-[#2E7D32] bg-[#2E7D32] text-white md:flex md:items-center md:portrait:h-[38.5svh] md:portrait:min-h-[360px] lg:landscape:block">
          {/* Background photo + green overlay: phones get one flat, fully opaque green layer; wider screens get a gradient, solid on the left (behind the text) and more transparent to the right */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center hidden md:block"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2000&auto=format&fit=crop)',
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center md:hidden" style={{ backgroundImage: 'url(/hero-mobile.webp)' }} />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#2E7D32] md:bg-transparent md:bg-gradient-to-r md:from-[#2E7D32] md:from-[55%] md:via-[#2E7D32]/55 md:via-[80%] md:to-transparent"
          />
          {/* Desktop only: the logo on the right column, over the overlay */}
          <div aria-hidden="true" className="hidden xl:flex absolute inset-y-0 right-10 w-[16%] min-[1400px]:w-[20.8%] items-center justify-center pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo || DEFAULT_LOGO} alt="" className="w-full max-h-[100%] object-contain drop-shadow-lg" />
          </div>
            <div className="relative w-full px-6 md:px-10 pt-5 pb-5 md:pt-9 md:pb-9 md:landscape:max-xl:pt-7 md:landscape:max-xl:pb-7 md:portrait:pt-7 md:portrait:pb-7">
            <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase">
              Distribución hortifrutícola B2B
            </span>
            <h1 className="mt-4 max-w-6xl text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.1]">
              El distribuidor hortifrutícola para
              <br className="hidden md:block" /> la gastronomía de Punta del Este.
            </h1>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm md:text-base text-white/95 font-normal leading-relaxed">
              Abastecemos a restaurantes, hoteles y comercios con frutas, verduras y hojas verdes seleccionadas en el
              mercado central. Logística integrada, precios mayoristas por volumen y entregas diarias en tu establecimiento.
            </p>
            <div className="mt-5 md:mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/items"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#1D1D1F] px-6 py-2.5 text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
              >
                <span>Acceso al Catálogo Mayorista</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>Solicitar acceso mayorista</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* --- SEARCH BAR --- */}

      {/* --- BODY: PROPERTY BENTO GRID --- */}
      <section id="properties" className="pt-5 md:pt-8 pb-8 md:pb-44 px-3 md:px-6 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2 mb-6">
        {categories.length > 0 ? (
          <div
            role="group"
            aria-label="Categorías"
            className="flex flex-1 min-w-0 flex-nowrap items-center gap-2 overflow-x-auto -ml-3 pl-3 md:mx-0 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[{ id: 'all', label: 'Todas' }, ...categories].map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c.id);
                    setPage(1);
                  }}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    active ? 'bg-[#2E7D32] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1" />
        )}
          <div role="group" aria-label="Diseño de la lista" className="md:hidden shrink-0 inline-flex rounded-full bg-[#F5F5F7] p-0.5">
            {([
              ['one', Square, '1 columna'],
              ['two', LayoutGrid, '2 columnas'],
              ['list', List, 'Lista'],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseLayout(value)}
                aria-pressed={layout === value}
                aria-label={label}
                title={label}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  layout === value ? 'bg-[#2E7D32] text-white' : 'text-[#515154] hover:bg-[#E8E8ED]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        <div className={`grid ${layout === 'two' ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6`}>
          {filteredProperties.length === 0 && (
            <p className="col-span-full text-center text-[#515154] text-sm">
              No hay artículos que coincidan con tu búsqueda.
            </p>
          )}
          {visibleProperties.map((prop) => {
            const cardClass =
              `group relative ${layout === 'one' ? 'aspect-[4/3] md:aspect-square' : 'aspect-square'} rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1`;
            const content = (
              <>
              {/* Background Image */}
              <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${prop.inStock === false ? 'opacity-50 grayscale' : ''}`}>
                <PropertyImage
                  src={prop.image}
                  alt={`${prop.title}, ${prop.location}`}
                  variant="card"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              {/* Whole card opens the item page (real items only); the cart button sits above it */}
              {prop.href && (
                <a href={prop.href} aria-label={`Ver ${prop.title}`} className="absolute inset-0 z-[5]" />
              )}
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Stock / sale badges */}
              <div className={`absolute ${layout === 'two' ? 'top-14' : 'top-3'} left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5`}>
                {prop.inStock === false && (
                  <span className={`bg-black/80 text-white ${layout === 'one' ? 'text-sm px-3 py-1.5' : 'text-[10px] px-2 py-1'} md:text-xs md:px-3 md:py-1 font-semibold rounded-full`}>Sin stock</span>
                )}
              </div>

              {/* Quick order: adds the item and opens the cart to send it */}
              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                {typeof prop.id === 'string' && <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8" />}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(prop);
                    setCartOpen(true);
                  }}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Pedido rápido: ${prop.title}`}
                  className={`${layout === 'one' ? 'h-10 px-4 text-sm' : 'h-8 px-3 text-[10px]'} md:h-8 md:px-3 md:text-xs rounded-full bg-[#2E7D32] text-white font-semibold whitespace-nowrap flex items-center justify-center shadow-sm hover:bg-[#256628] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Pedido rápido
                </button>
              </div>

              {/* Bottom Details: row 1 title, row 2 quantity + price */}
              <div className="relative z-10 text-white pointer-events-none">
                <h3 className={`${layout === 'one' ? 'text-2xl mb-3' : 'text-sm mb-2'} md:text-lg md:mb-3 font-semibold tracking-tight leading-tight`}>{prop.title}</h3>
                <div className={`flex flex-wrap items-end justify-between gap-x-2 ${layout === 'one' ? 'text-lg' : 'text-xs'} md:text-base font-medium`}>
                  <span className="text-white/80 truncate">{prop.stats ? prop.stats[1] : prop.area}</span>
                  <span className="max-w-full font-semibold">
                    {prop.salePrice ? (
                      <>
                        <s className="text-white/60 font-normal mr-1.5">{prop.price}</s>
                        {prop.salePrice}
                      </>
                    ) : (
                      prop.price
                    )}
                  </span>
                </div>
              </div>
              </>
            );
            const soldOut = prop.inStock === false;
            const Thumb = prop.href ? 'a' : 'div';
            return (
              <div key={prop.id}>
                {/* Grid card: hidden on phones in list mode */}
                <div className={layout === 'list' ? 'hidden md:block' : ''}>
                  <div className={cardClass}>{content}</div>
                </div>
                {/* Compact list row: phones only */}
                {layout === 'list' && (
                  <div className="md:hidden flex items-center gap-3 rounded-2xl bg-white border border-[#000000]/5 p-2.5">
                    <Thumb
                      {...(prop.href ? { href: prop.href, 'aria-label': `Ver ${prop.title}` } : {})}
                      className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#E5E5EA] ${soldOut ? 'opacity-50 grayscale' : ''}`}
                    >
                      <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="96px" />
                    </Thumb>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight line-clamp-2">{prop.href ? <a href={prop.href}>{prop.title}</a> : prop.title}</p>
                      <p className="text-xs text-[#515154] mt-0.5 truncate">{prop.stats ? prop.stats[1] : prop.area}</p>
                      <p className="text-base font-semibold mt-1">
                        {soldOut ? (
                          <span className="text-xs font-semibold text-[#515154]">Sin stock</span>
                        ) : prop.salePrice ? (
                          <>
                            <s className="text-[#86868B] font-normal mr-1.5">{prop.price}</s>
                            {prop.salePrice}
                          </>
                        ) : (
                          prop.price
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {typeof prop.id === 'string' && (
                        <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8 border border-[#000000]/5" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prop);
                          setCartOpen(true);
                        }}
                        disabled={soldOut}
                        aria-label={soldOut ? `${prop.title} está sin stock` : `Pedido rápido: ${prop.title}`}
                        className="h-8 px-3 rounded-full bg-[#2E7D32] text-white text-[10px] font-semibold whitespace-nowrap hover:bg-[#256628] active:scale-95 transition disabled:opacity-40"
                      >
                        Pedido rápido
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid footer: see all / advanced search / count */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm">
          <Link
            href="/items"
            className="justify-self-center md:justify-self-start inline-flex items-center space-x-2 font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors"
          >
            <span>Ver todos los artículos</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <nav aria-label="Paginación" className={`justify-self-center flex items-center gap-1 ${totalPages < 2 ? 'invisible' : ''}`}>
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageItems.map((n, i) =>
              n === 'gap' ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[#86868B]">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-label={`Página ${n}`}
                  aria-current={n === currentPage ? 'page' : undefined}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                    n === currentPage ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F5F5F7]'
                  }`}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
          <p className="justify-self-center md:justify-self-end text-xs text-[#515154]">
            {filteredProperties.length === 0
              ? 'Sin artículos'
              : `Mostrando ${pageStart + 1}–${pageStart + visibleProperties.length} de ${filteredProperties.length} artículos`}
          </p>
        </div>
      </section>

      <InfoSections />

      <SiteFooter />

    </div>
  );
}
