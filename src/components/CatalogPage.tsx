'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import { typeLabels } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import CartDrawer, { unitPriceOf, type CartLine } from '@/src/components/CartDrawer';
import SiteFooter from '@/src/components/SiteFooter';
import WholesaleAccess from '@/src/components/WholesaleAccess';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import { useClient } from '@/src/context/ClientContext';
import { applyLevel } from '@/src/utils/pricing';
import SimilarItems, { type SimilarItem } from '@/src/components/SimilarItems';

const PAGE_SIZE = 12;

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'name';
type Availability = 'all' | 'in-stock' | 'on-sale';

const sortLabels: Record<Sort, string> = {
  relevance: 'Más recientes',
  'price-asc': 'Precio: menor a mayor',
  'price-desc': 'Precio: mayor a menor',
  name: 'Nombre: A–Z',
};

const availabilityLabels: Record<Availability, string> = {
  all: 'Todos',
  'in-stock': 'Solo en stock',
  'on-sale': 'En oferta',
};

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-3 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-[10px] uppercase tracking-wider font-semibold text-[#515154] mb-1.5';

export default function CatalogPage({ items: baseItems }: { items: HomeProperty[] }) {
  // A customer who opened their access link sees their price level; everyone else sees list prices.
  const { level } = useClient();
  const items = useMemo(() => applyLevel(baseItems, level), [baseItems, level]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState<Availability>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('relevance');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile only

  // Cart (same behaviour as the homepage).
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const cartLines: CartLine[] = items.filter((p) => cart[String(p.id)]).map((p) => ({ item: p, qty: cart[String(p.id)] }));
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const addToCart = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const changeQty = (id: string, delta: number) => setCart((c) => ({ ...c, [id]: Math.max(1, (c[id] ?? 1) + delta) }));
  const removeFromCart = (id: string) => setCart((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== id)));

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          items
            .filter((p) => p.type)
            .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
        ),
        ([id, label]) => ({ id, label }),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const list = items.filter((p) => {
      if (q) {
        const haystack = [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category !== 'all' && p.type !== category) return false;
      if (availability === 'in-stock' && p.inStock === false) return false;
      if (availability === 'on-sale' && !(p.salePrice && p.inStock !== false)) return false;
      const price = unitPriceOf(p);
      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;
      return true;
    });
    if (sort === 'price-asc') list.sort((a, b) => unitPriceOf(a) - unitPriceOf(b));
    else if (sort === 'price-desc') list.sort((a, b) => unitPriceOf(b) - unitPriceOf(a));
    else if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    return list;
  }, [items, query, category, availability, minPrice, maxPrice, sort]);

  // Orders are private, so sales can't be counted here: the slider shows the "destacado" items
  // (or the first ones if none is marked).
  const bestSellers: SimilarItem[] = useMemo(() => {
    const featured = items.filter((p) => p.featured);
    return (featured.length ? featured : items).slice(0, 10).map((p) => ({
      id: String(p.id),
      title: p.title,
      image: p.image,
      price: p.price,
      salePrice: p.salePrice,
      quantity: p.area,
      inStock: p.inStock !== false,
    }));
  }, [items]);

  const activeFilters =
    (query.trim() ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (availability !== 'all' ? 1 : 0) +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0);

  const reset = () => {
    setQuery('');
    setCategory('all');
    setAvailability('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('relevance');
    setPage(1);
  };

  // A filter change goes back to page 1; the page never exceeds the last one.
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ['gap' as const, n] : [n]));

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">
      {/* --- NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-[#000000]/5">
        <div className="bg-black text-white text-center text-xs font-medium tracking-wide py-1.5 px-6">
          Envío gratis en pedidos de más de US$ 50
        </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg tracking-tight">Merkado<span className="sm:hidden"> M</span><span className="hidden sm:inline"> para Mayoristas</span>.</Link>
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

      {/* --- HERO WITH ADVANCED SEARCH --- */}
      <section className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=2000&auto=format&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/35" />
        </div>

        <div className="relative max-w-7xl mx-auto px-3 md:px-6 pt-32 md:pt-40 pb-8 md:pb-12 text-white">
          <div className="px-3 md:px-0 mb-8 md:mb-10 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-3">Todos los productos</h1>
            <p className="text-base md:text-xl text-white/90 font-light">
              Buscá, filtrá y ordená todo el catálogo: frutas, verduras y hojas verdes frescas.
            </p>
          </div>

          <form
            role="search"
            aria-label="Búsqueda avanzada"
            onSubmit={(e) => {
              e.preventDefault();
              goToPage(1);
            }}
            className="bg-white text-[#1D1D1F] rounded-2xl shadow-lg border border-[#000000]/5 p-3 md:p-4"
          >
            <div className="flex items-center gap-2">
              <Search className="hidden md:block ml-2 w-5 h-5 text-[#515154] shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => change(setQuery)(e.target.value)}
                placeholder="Buscá por nombre, categoría o precio…"
                aria-label="Buscar artículos por nombre, categoría o precio"
                className="min-w-0 flex-1 bg-transparent px-3 md:px-2 py-3 text-sm placeholder:text-[#86868B] outline-none"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="advanced-filters"
                className="md:hidden shrink-0 relative w-11 h-11 rounded-full bg-[#F5F5F7] flex items-center justify-center"
                aria-label="Mostrar filtros"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilters > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
              <button
                type="submit"
                aria-label="Buscar"
                className="shrink-0 bg-[#1D1D1F] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#333336] transition-all flex items-center justify-center"
              >
                <Search className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Buscar</span>
              </button>
            </div>

            <div
              id="advanced-filters"
              className={`${filtersOpen ? 'grid' : 'hidden'} md:grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-3 pt-3 md:mt-4 md:pt-4 border-t border-[#000000]/5`}
            >
              <div>
                <label htmlFor="f-category" className={labelClass}>Categoría</label>
                <select
                  id="f-category"
                  value={category}
                  onChange={(e) => change(setCategory)(e.target.value)}
                  className={fieldClass}
                >
                  <option value="all">Todas</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-availability" className={labelClass}>Disponibilidad</label>
                <select
                  id="f-availability"
                  value={availability}
                  onChange={(e) => change(setAvailability)(e.target.value as Availability)}
                  className={fieldClass}
                >
                  {(Object.keys(availabilityLabels) as Availability[]).map((a) => (
                    <option key={a} value={a}>{availabilityLabels[a]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-min" className={labelClass}>Precio mínimo (US$)</label>
                <input
                  id="f-min"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={minPrice}
                  onChange={(e) => change(setMinPrice)(e.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="f-max" className={labelClass}>Precio máximo (US$)</label>
                <input
                  id="f-max"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={maxPrice}
                  onChange={(e) => change(setMaxPrice)(e.target.value)}
                  placeholder="Sin límite"
                  className={fieldClass}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="f-sort" className={labelClass}>Ordenar por</label>
                <select
                  id="f-sort"
                  value={sort}
                  onChange={(e) => change(setSort)(e.target.value as Sort)}
                  className={fieldClass}
                >
                  {(Object.keys(sortLabels) as Sort[]).map((s) => (
                    <option key={s} value={s}>{sortLabels[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 md:mt-4 px-1 text-xs text-[#515154]">
              <p aria-live="polite">
                {filtered.length} {filtered.length === 1 ? 'artículo' : 'artículos'}
              </p>
              {(activeFilters > 0 || sort !== 'relevance') && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 font-medium text-[#1D1D1F] hover:text-[#515154]"
                >
                  <X className="w-3.5 h-3.5" /> Borrar filtros
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* --- ALL PRODUCTS: 4-column grid --- */}
      <section id="catalog" className={`pt-8 md:pt-12 ${activeFilters === 0 && bestSellers.length > 0 ? 'pb-8 md:pb-12' : 'pb-32'} px-3 md:px-6 max-w-7xl mx-auto scroll-mt-32`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-[#515154] text-sm py-16">
              <p>No hay artículos que coincidan con tu búsqueda.</p>
              <button type="button" onClick={reset} className="mt-3 font-medium text-[#1D1D1F] underline underline-offset-4">
                Borrar filtros
              </button>
            </div>
          )}
          {visible.map((prop) => (
            <div
              key={prop.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${prop.inStock === false ? 'opacity-50 grayscale' : ''}`}>
                <PropertyImage
                  src={prop.image}
                  alt={prop.title}
                  variant="card"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              {prop.href && (
                <Link href={prop.href} aria-label={`Ver ${prop.title}`} className="absolute inset-0 z-[5]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Sin stock</span>
                )}
                {prop.salePrice && prop.inStock !== false && (
                  <span className="bg-white text-black text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Oferta</span>
                )}
              </div>

              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                {typeof prop.id === 'string' && <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8" />}
                <button
                  type="button"
                  onClick={() => addToCart(String(prop.id))}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-sm hover:bg-[#F5F5F7] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 text-white pointer-events-none">
                <h2 className="text-sm md:text-lg font-semibold tracking-tight mb-2 md:mb-3 leading-tight">{prop.title}</h2>
                <div className="flex items-center justify-between gap-2 text-[10px] md:text-sm font-medium">
                  <span className="text-white/80 truncate">{prop.area}</span>
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
            </div>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm">
            <Link href="/" className="justify-self-center md:justify-self-start font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors">
              ← Volver al inicio
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
              Mostrando {pageStart + 1}–{pageStart + visible.length} de {filtered.length} artículos
            </p>
          </div>
        )}
      </section>

      {/* --- MÁS VENDIDOS: just above the footer (hidden while filtering) --- */}
      {activeFilters === 0 && bestSellers.length > 0 && (
        <div className="pb-20 md:pb-28 [&>section]:px-3 md:[&>section]:px-6 [&>section>ul]:-mx-3 [&>section>ul]:px-3 md:[&>section>ul]:mx-0 md:[&>section>ul]:px-0">
          <SimilarItems title="Más vendidos" items={bestSellers} />
        </div>
      )}

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
