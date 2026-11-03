'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HeroSlide, HomeProperty } from '@/src/lib/homeData';
import type { PropertyType } from '@/src/types/firestore';
import { typeLabels } from '@/src/utils/format';
import SiteFooter from '@/src/components/SiteFooter';
import PropertyImage from '@/src/components/PropertyImage';
import CartDrawer, { type CartLine } from '@/src/components/CartDrawer';
import {
  ArrowUpRight,
  MapPin,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
} from 'lucide-react';

const PAGE_SIZE = 12;

// --- HERO SLIDES DATA ---
// Shown until featured properties load (or if there are none yet).
const fallbackSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Vine Tomatoes",
    location: "Salinas Valley, CA",
    price: "$4.50 / lb",
    tagline: "Sun-ripened and picked at dawn.",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Seedless Watermelon",
    location: "Fresno, CA",
    price: "$6.90 each",
    tagline: "Crisp, sweet, and chilled to order.",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Ataulfo Mangoes",
    location: "Oxnard, CA",
    price: "$18.00 / case",
    tagline: "Buttery flesh, no fibers, peak season.",
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Farmers Market Box",
    location: "Watsonville, CA",
    price: "$32.00 / box",
    tagline: "A week of seasonal vegetables in one crate.",
    image: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Tropical Fruit Mix",
    location: "Santa Barbara, CA",
    price: "$24.00 / box",
    tagline: "Papaya, kiwi, grapes and citrus, ready to eat.",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2000&auto=format&fit=crop",
  },
];

// --- HARDCODED PROPERTIES (Bento Grid) ---
const fallbackProperties: HomeProperty[] = [
  {
    id: 1,
    title: "Vine Tomatoes",
    location: "Salinas, CA",
    price: "$4.50 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Organic", "12 lb case", "Grade A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Seedless Watermelon",
    location: "Fresno, CA",
    price: "$6.90 each",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Non-GMO", "18 lb each", "Grade A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Ataulfo Mangoes",
    location: "Oxnard, CA",
    price: "$18.00 / case",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Organic", "10 lb case", "Grade A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Gold Pineapples",
    location: "Santa Barbara, CA",
    price: "$3.80 each",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Conventional", "4 lb each", "Grade A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Russet Potatoes",
    location: "Idaho Falls, ID",
    price: "$0.85 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Conventional", "50 lb sack", "Grade B"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Clementine Tangerines",
    location: "Bakersfield, CA",
    price: "$2.20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Organic", "5 lb box", "Grade A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Garden Vegetable Mix",
    location: "Watsonville, CA",
    price: "$32.00 / box",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Organic", "20 lb box", "Grade A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Berry & Citrus Mix",
    location: "Oxnard, CA",
    price: "$21.00 / box",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Non-GMO", "8 lb box", "Grade A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Salad Greens",
    location: "Castroville, CA",
    price: "$3.20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Organic", "10 lb case", "Grade A"],
    type: 'leafy',
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
  },
];


export default function CoastalWebHome({
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
  const [properties] = useState<HomeProperty[]>(
    initialProperties.length
      ? initialProperties
      : fallbackProperties.map((p) => ({ ...p, href: `/items/sample-${p.id}` })),
  );
  const [query, setQuery] = useState('');
  // Wholesale (mayorista) enrollment form in the contact section.
  const [wholesale, setWholesale] = useState({
    business: '',
    name: '',
    email: '',
    phone: '',
    kind: 'Restaurant',
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
        property: 'Mayorista enrollment',
        channel: 'Portal',
        message: [
          `[Mayorista] Business: ${wholesale.business.trim()} (${wholesale.kind})`,
          wholesale.volume.trim() && `Estimated weekly volume: ${wholesale.volume.trim()}`,
          wholesale.message.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setWholesale({ business: '', name: '', email: '', phone: '', kind: 'Restaurant', volume: '', message: '' });
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
  const [buyerType, setBuyerType] = useState<'retail' | 'wholesale'>('retail');
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
  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setPage(1);
  };

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
          Free delivery on orders over $50
        </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">Merkado.</span>
          <div
            role="radiogroup"
            aria-label="Customer type"
            className="inline-flex rounded-full bg-[#F5F5F7] border border-[#000000]/5 p-0.5 text-xs font-medium"
          >
            {([['retail', 'Minorista'], ['wholesale', 'Mayorista']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={buyerType === value}
                onClick={() => setBuyerType(value)}
                className={`px-3 md:px-4 py-1.5 rounded-full transition-colors ${
                  buyerType === value ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:text-[#1D1D1F]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative ml-2 w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
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
                  <span>Request Details</span>
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
                aria-label={`Go to slide ${slideIndex + 1}`}
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
              placeholder="Search by name, category or price…"
              aria-label="Search items by name, category or price"
              className="min-w-0 flex-1 bg-transparent px-2 md:px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="shrink-0 bg-[#1D1D1F] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#333336] transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>
        </form>
      </section>

      {/* --- BODY: PROPERTY BENTO GRID --- */}
      <section id="properties" className="pt-14 md:pt-20 pb-44 px-3 md:px-6 max-w-7xl mx-auto">
        {categories.length > 0 && (
          <div
            role="group"
            aria-label="Categories"
            className="flex flex-nowrap items-center gap-2 mb-6 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[{ id: 'all', label: 'All' }, ...categories].map((c) => {
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
              No items match your search.
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
                <a href={prop.href} aria-label={`View ${prop.title}`} className="absolute inset-0 z-[5]" />
              )}
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Stock / sale badges */}
              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Out of stock</span>
                )}
                {prop.salePrice && prop.inStock !== false && (
                  <span className="bg-white text-black text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Sale</span>
                )}
              </div>

              {/* Add to cart */}
              <button
                type="button"
                onClick={() => addToCart(String(prop.id))}
                disabled={prop.inStock === false}
                aria-label={prop.inStock === false ? `${prop.title} is out of stock` : `Add ${prop.title} to cart`}
                className="absolute top-3 right-3 md:top-5 md:right-5 z-10 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-sm hover:bg-[#F5F5F7] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Bottom Details: row 1 title, row 2 quantity + price */}
              <div className="relative z-10 text-white">
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
          <button
            type="button"
            onClick={resetFilters}
            className="justify-self-center md:justify-self-start inline-flex items-center space-x-2 font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors"
          >
            <span>See all items</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <nav aria-label="Pagination" className={`justify-self-center flex items-center gap-1 ${totalPages < 2 ? 'invisible' : ''}`}>
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
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
                  aria-label={`Page ${n}`}
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
              aria-label="Next page"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
          <p className="justify-self-center md:justify-self-end text-xs text-[#515154]">
            {filteredProperties.length === 0
              ? 'No items'
              : `Showing ${pageStart + 1}–${pageStart + visibleProperties.length} of ${filteredProperties.length} items`}
          </p>
        </div>
      </section>

      {/* --- WHO WE ARE --- */}
      <section id="vision" className="pb-44 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold">Who We Are</h2>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight">
              Fresh produce, delivered straight from the grower.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Merkado is a food distributor that connects farms and growers with restaurants,
              grocers and families. We source fruit, vegetables and leafy greens directly,
              handle them with care from the field to the cold chain, and deliver them fresh
              to your door.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Every order is packed to size, weighed and priced clearly, so you always know
              what you are getting. Tell us what you need and we will take care of the rest.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center space-x-2 text-sm font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors"
            >
              <span>Get in touch</span>
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
              Buy more, pay less. Open a wholesale account.
            </p>
            <p className="text-[#515154] font-light leading-relaxed mb-12">
              Restaurants, grocers, hotels and caterers: enroll as a mayorista and get better prices on
              the quantities your business buys. Tell us what you need each week and we will set up
              your account and contact you with your wholesale prices.
            </p>
          </div>

          {/* Right Column: wholesale enrollment form */}
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#000000]/5">
            <form onSubmit={submitWholesale} className="space-y-5">
              <div>
                <label htmlFor="w-business" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Business name</label>
                <input id="w-business" type="text" required value={wholesale.business} onChange={(e) => setWholesale({ ...wholesale, business: e.target.value })} placeholder="La Esquina Restaurant" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-name" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Contact name</label>
                  <input id="w-name" type="text" required value={wholesale.name} onChange={(e) => setWholesale({ ...wholesale, name: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
                <div>
                  <label htmlFor="w-phone" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Phone</label>
                  <input id="w-phone" type="tel" required value={wholesale.phone} onChange={(e) => setWholesale({ ...wholesale, phone: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-email" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Email</label>
                <input id="w-email" type="email" required value={wholesale.email} onChange={(e) => setWholesale({ ...wholesale, email: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-kind" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Type of business</label>
                  <select id="w-kind" value={wholesale.kind} onChange={(e) => setWholesale({ ...wholesale, kind: e.target.value })} className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors">
                    {['Restaurant', 'Grocery or market', 'Hotel or catering', 'Reseller', 'Other'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="w-volume" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Weekly volume</label>
                  <input id="w-volume" type="text" value={wholesale.volume} onChange={(e) => setWholesale({ ...wholesale, volume: e.target.value })} placeholder="e.g. 200 lb of tomatoes" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-message" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">What do you need? (optional)</label>
                <textarea id="w-message" rows={3} value={wholesale.message} onChange={(e) => setWholesale({ ...wholesale, message: e.target.value })} placeholder="Products, delivery days, anything we should know…" className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors resize-none" />
              </div>
              <button
                type="submit"
                disabled={leadState === 'sending'}
                className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-[#333336] transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <span>{leadState === 'sending' ? 'Sending…' : 'Enroll as Mayorista'}</span>
                <Send className="w-4 h-4" />
              </button>
              {leadState === 'sent' && (
                <p role="status" className="text-sm text-green-700 text-center">
                  Thank you! We will contact you shortly about your wholesale account.
                </p>
              )}
              {leadState === 'error' && (
                <p role="alert" className="text-sm text-red-600 text-center">
                  Something went wrong. Please try again or contact us directly.
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
        buyerType={buyerType}
      />

      <SiteFooter />

    </div>
  );
}
