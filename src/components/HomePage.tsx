'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HeroSlide, HomeProperty } from '@/src/lib/homeData';
import type { PropertyType } from '@/src/types/firestore';
import { typeLabels } from '@/src/utils/format';
import SiteFooter from '@/src/components/SiteFooter';
import PropertyImage from '@/src/components/PropertyImage';
import CartDrawer, { type CartLine } from '@/src/components/CartDrawer';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import { useClient } from '@/src/context/ClientContext';
import { applyLevel } from '@/src/utils/pricing';
import {
  ArrowUpRight,
  MapPin,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';

const PAGE_SIZE = 12;

// --- HERO SLIDES DATA ---
// Se muestran hasta que haya artículos destacados (o si todavía no hay ninguno).
const fallbackSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Tomates perita",
    location: "Canelones, UY",
    price: "US$ 4,50 / lb",
    tagline: "Madurados al sol y cosechados al amanecer.",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Sandía sin semillas",
    location: "Salto, UY",
    price: "US$ 6,90 c/u",
    tagline: "Crocante, dulce y bien fría.",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Mangos Ataulfo",
    location: "Rivera, UY",
    price: "US$ 18,00 / cajón",
    tagline: "Pulpa cremosa y sin fibras, en plena temporada.",
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Caja de la feria",
    location: "Montevideo, UY",
    price: "US$ 32,00 / caja",
    tagline: "Una semana de verduras de estación en un solo cajón.",
    image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Mix de frutas tropicales",
    location: "Paysandú, UY",
    price: "US$ 24,00 / caja",
    tagline: "Papaya, kiwi, uvas y cítricos, listos para comer.",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2000&auto=format&fit=crop",
  },
];

// --- HARDCODED PROPERTIES (Bento Grid) ---
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
  initialSlides = [],
}: {
  /** Active properties loaded on the server; the built-in samples show if there are none. */
  initialProperties?: HomeProperty[];
  initialSlides?: HeroSlide[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides] = useState<HeroSlide[]>(initialSlides.length ? initialSlides : fallbackSlides);
  // The built-in samples open /items/sample-N, which the item page fills from the same sample data.
  const [baseProperties] = useState<HomeProperty[]>(
    initialProperties.length
      ? initialProperties
      : fallbackProperties.map((p) => ({ ...p, href: `/items/sample-${p.id}` })),
  );
  // A customer who logged in with Acceso mayoristas sees their price level; everyone else sees list prices.
  const { level } = useClient();
  const properties = useMemo(() => applyLevel(baseProperties, level), [baseProperties, level]);
  const [query, setQuery] = useState('');
  // Wholesale (mayorista) enrollment form in the contact section.
  const [wholesale, setWholesale] = useState({
    business: '',
    name: '',
    email: '',
    phone: '',
    kind: 'Restaurante',
    volume: '',
    message: '',
  });
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submitWholesale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      setLeadState('error');
      return;
    }
    setLeadState('sending');
    try {
      await addDoc(collection(db, 'leads'), {
        name: wholesale.name.trim(),
        email: wholesale.email.trim(),
        phone: wholesale.phone.trim(),
        property: 'Alta de mayorista',
        channel: 'Portal',
        message: [
          `[Mayorista] Negocio: ${wholesale.business.trim()} (${wholesale.kind})`,
          wholesale.volume.trim() && `Volumen semanal estimado: ${wholesale.volume.trim()}`,
          wholesale.message.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setWholesale({ business: '', name: '', email: '', phone: '', kind: 'Restaurante', volume: '', message: '' });
      setLeadState('sent');
    } catch {
      setLeadState('error');
    }
  };

  const [category, setCategory] = useState<PropertyType | 'all'>('all');
  const [page, setPage] = useState(1);
  // Minorista (retail) / Mayorista (wholesale); sent along with the order.
  // Cart: item id -> quantity.
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const cartLines: CartLine[] = properties
    .filter((p) => cart[String(p.id)])
    .map((p) => ({ item: p, qty: cart[String(p.id)] }));
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const addToCart = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const changeQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(1, (c[id] ?? 1) + delta) }));
  const removeFromCart = (id: string) =>
    setCart((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== id)));
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

  // Auto-advance slideshow every 6 seconds
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);


  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">

      {/* --- NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-[#000000]/5">
        <div className="bg-black text-white text-center text-xs font-medium tracking-wide py-1.5 px-6">
          Envío gratis en pedidos de más de US$ 50
        </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">Merkado<span className="sm:hidden"> M</span><span className="hidden sm:inline"> para Mayoristas</span>.</span>
          <SiteNavLinks />
          <div className="flex items-center gap-1">
          <WholesaleAccess />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}`}
            className="relative ml-2 w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <MobileNavMenu />
          </div>
        </div>
      </header>

      {/* --- HERO SLIDESHOW (5-slide full-width) --- */}
      <section className="relative w-full h-[60vh] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              index === currentSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Background Image with subtle zoom */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ease-out ${
                index === currentSlide ? 'scale-105' : 'scale-100'
              }`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Gradient Overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
            </div>

            {/* Content Container */}
            <div className="relative max-w-7xl mx-auto h-full px-6 flex flex-col justify-end md:flex-row md:items-end gap-8 pb-20 md:pb-28 text-white">
              <div className="max-w-2xl md:mr-auto transform transition-all duration-700 translate-y-0">
                <div className="flex items-center space-x-2 text-white/80 text-sm font-medium tracking-wide mb-3 uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>{slide.location}</span>
                  <span aria-hidden="true" className="text-white/40">·</span>
                  <span className="text-white">{slide.price}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-4">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 font-light">
                  {slide.tagline}
                </p>
              </div>
              <div className="hidden md:block md:pr-16">
                <a
                  href="#contact"
                  className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-white/90 transition-all"
                >
                  <span>Pedir detalles</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Slideshow indicator: 3 vertical dots (first / middle / last slide) */}
        <div className={`absolute top-1/2 -translate-y-1/2 right-6 z-20 flex flex-col items-center gap-3 ${slides.length < 2 ? 'hidden' : ''}`}>
          {Array.from(new Set([0, Math.floor((slides.length - 1) / 2), slides.length - 1])).map((slideIndex, dot, arr) => {
            // The active dot is the one whose slide index is closest to the current slide.
            const active =
              arr.reduce((best, v, i) => (Math.abs(v - currentSlide) < Math.abs(arr[best] - currentSlide) ? i : best), 0) === dot;
            return (
              <button
                key={slideIndex}
                onClick={() => setCurrentSlide(slideIndex)}
                aria-label={`Ir a la diapositiva ${slideIndex + 1}`}
                aria-current={active ? 'true' : undefined}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  active ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            );
          })}
        </div>

        {/* Slide Indicators Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </section>

      {/* --- SEARCH BAR --- */}
      <section id="search" className="px-3 md:px-6 max-w-7xl mx-auto h-0 relative z-30">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="-translate-y-1/2 bg-white rounded-2xl shadow-lg border border-[#000000]/5 p-3 flex flex-col gap-3"
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
              className="shrink-0 bg-[#1D1D1F] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#333336] transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Buscar</span>
            </button>
          </div>
        </form>
      </section>

      {/* --- BODY: PROPERTY BENTO GRID --- */}
      <section id="properties" className="pt-14 md:pt-20 pb-44 px-3 md:px-6 max-w-7xl mx-auto">
        {categories.length > 0 && (
          <div
            role="group"
            aria-label="Categorías"
            className="flex flex-nowrap items-center gap-2 mb-6 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    active ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {filteredProperties.length === 0 && (
            <p className="col-span-full text-center text-[#515154] text-sm">
              No hay artículos que coincidan con tu búsqueda.
            </p>
          )}
          {visibleProperties.map((prop) => {
            const cardClass =
              'group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1';
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
              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Sin stock</span>
                )}
                {prop.salePrice && prop.inStock !== false && (
                  <span className="bg-white text-black text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Oferta</span>
                )}
              </div>

              {/* Quick order: adds the item and opens the cart to send it */}
              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                {typeof prop.id === 'string' && <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8" />}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(String(prop.id));
                    setCartOpen(true);
                  }}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Pedido rápido: ${prop.title}`}
                  className="h-8 px-3 rounded-full bg-white text-black text-[10px] md:text-xs font-semibold whitespace-nowrap flex items-center justify-center shadow-sm hover:bg-[#F5F5F7] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Pedido rápido
                </button>
              </div>

              {/* Bottom Details: row 1 title, row 2 quantity + price */}
              <div className="relative z-10 text-white pointer-events-none">
                <h3 className="text-sm md:text-lg font-semibold tracking-tight mb-2 md:mb-3 leading-tight">{prop.title}</h3>
                <div className="flex items-center justify-between gap-2 text-[10px] md:text-sm font-medium">
                  <span className="text-white/80 truncate">{prop.stats ? prop.stats[1] : prop.area}</span>
                  <span className="shrink-0 font-semibold">
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
            return (
              <div key={prop.id} className={cardClass}>
                {content}
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
                    n === currentPage ? 'bg-[#1D1D1F] text-white' : 'hover:bg-[#F5F5F7]'
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

      {/* --- WHO WE ARE --- */}
      <section id="vision" className="pt-[75px] md:pt-[107px] pb-44 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold">Quiénes somos</h2>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight">
              Productos frescos, directo del productor.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Merkado es un distribuidor de alimentos que conecta chacras y productores con
              restaurantes, almacenes y familias. Compramos frutas, verduras y hojas verdes
              directamente, las cuidamos desde el campo hasta la cadena de frío y te las
              llevamos frescas hasta la puerta.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Cada pedido se arma a medida, se pesa y tiene el precio claro, para que siempre
              sepas qué estás llevando. Contanos qué necesitás y nosotros nos encargamos del resto.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center space-x-2 text-sm font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors"
            >
              <span>Contactanos</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl bg-cover bg-center bg-[#E5E5EA]"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=1200&auto=format&fit=crop)',
            }}
          />
        </div>
      </section>

      {/* --- CALL TO ACTION & CONTACT FORM --- */}
      <section id="contact" className="py-44 px-6 bg-[#F2F2F7] border-t border-b border-[#000000]/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left Column: wholesale pitch + company data */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">Mayoristas</h2>
            <p className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
              Comprá más, pagá menos. Pedí tu acceso mayorista.
            </p>
            <p className="text-[#515154] font-light leading-relaxed mb-12">
              Restaurantes, almacenes, hoteles y servicios de catering: solicitá tu acceso mayorista y
              conseguí mejores precios por las cantidades que compra tu negocio. Contanos qué
              necesitás cada semana y revisamos tu solicitud y, una vez aprobada y configurada la forma de pago, te enviamos tu contraseña de acceso para ver tus precios y hacer tus pedidos.
            </p>
          </div>

          {/* Right Column: wholesale enrollment form */}
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#000000]/5">
            <form onSubmit={submitWholesale} className="space-y-5">
              <div>
                <label htmlFor="w-business" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Nombre del negocio</label>
                <input id="w-business" type="text" required value={wholesale.business} onChange={(e) => setWholesale({ ...wholesale, business: e.target.value })} placeholder="Restaurante La Esquina" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-name" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Nombre de contacto</label>
                  <input id="w-name" type="text" required value={wholesale.name} onChange={(e) => setWholesale({ ...wholesale, name: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
                <div>
                  <label htmlFor="w-phone" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Teléfono</label>
                  <input id="w-phone" type="tel" required value={wholesale.phone} onChange={(e) => setWholesale({ ...wholesale, phone: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-email" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Correo electrónico</label>
                <input id="w-email" type="email" required value={wholesale.email} onChange={(e) => setWholesale({ ...wholesale, email: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-kind" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Tipo de negocio</label>
                  <select id="w-kind" value={wholesale.kind} onChange={(e) => setWholesale({ ...wholesale, kind: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors">
                    {['Restaurante', 'Almacén o mercado', 'Hotel o catering', 'Revendedor', 'Otro'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="w-volume" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Volumen semanal</label>
                  <input id="w-volume" type="text" value={wholesale.volume} onChange={(e) => setWholesale({ ...wholesale, volume: e.target.value })} placeholder="ej. 200 lb de tomates" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-message" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">¿Qué necesitás? (opcional)</label>
                <textarea id="w-message" rows={3} value={wholesale.message} onChange={(e) => setWholesale({ ...wholesale, message: e.target.value })} placeholder="Productos, días de entrega, cualquier cosa que debamos saber…" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors resize-none" />
              </div>
              <button
                type="submit"
                disabled={leadState === 'sending'}
                className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-[#333336] transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <span>{leadState === 'sending' ? 'Enviando…' : 'Solicitar acceso mayorista'}</span>
                <Send className="w-4 h-4" />
              </button>
              {leadState === 'sent' && (
                <p role="status" className="text-sm text-green-700 text-center">
                  ¡Gracias! Revisamos tu solicitud y nos comunicamos con vos para coordinar la aprobación y la forma de pago. Después te enviamos tu contraseña de acceso.
                </p>
              )}
              {leadState === 'error' && (
                <p role="alert" className="text-sm text-red-600 text-center">
                  Algo salió mal. Probá de nuevo o contactanos directamente.
                </p>
              )}
            </form>
          </div>

        </div>
      </section>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cartLines}
        onChangeQty={changeQty}
        onRemove={removeFromCart}
        onPlaced={() => setCart({})}
        buyerType={level ? 'wholesale' : 'retail'}
      />

      <SiteFooter />

    </div>
  );
}
