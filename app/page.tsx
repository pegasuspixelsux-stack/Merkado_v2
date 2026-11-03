'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query as fsQuery, where, addDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { formatMoney, operationLabels, typeLabels } from '@/src/utils/format';
import { ikUrl } from '@/src/utils/imagekit';
import SiteFooter from '@/src/components/SiteFooter';
import PropertyImage from '@/src/components/PropertyImage';
import {
  ArrowUpRight,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Mail,
  Phone,
  Send,
  Search,
  SlidersHorizontal,
  Home,
  Key,
  TrendingUp,
  Compass,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

// --- FOCUS AREAS ---
const zones = [
  {
    name: "Big Sur",
    search: "Big Sur",
    description: "Dramatic cliffs and total seclusion above the Pacific.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Malibu",
    search: "Malibu",
    description: "Beachfront and canyon estates along the Pacific Coast Highway.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Carmel-by-the-Sea",
    search: "Carmel",
    description: "Storybook village charm minutes from the shoreline.",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Laguna Beach",
    search: "Laguna",
    description: "Artistic coves and oceanfront estates in Orange County.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Monterey",
    search: "Monterey",
    description: "Windswept dunes and historic coastal neighborhoods.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Pebble Beach",
    search: "Pebble Beach",
    description: "Golf-course estates with sweeping ocean views.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
  },
];

// --- TEAM (placeholder people) ---
const team = [
  {
    name: "Elena Marlowe",
    role: "Founder & Principal Broker",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Daniel Reyes",
    role: "Senior Partner, Acquisitions",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Sofia Lindqvist",
    role: "Head of Client Experience",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "James Whitaker",
    role: "Director of Market Strategy",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  },
];

// --- SERVICES ---
const services = [
  {
    icon: Key,
    title: "Buyer Representation",
    description: "Private access to off-market coastal residences, with negotiation handled start to finish.",
  },
  {
    icon: Home,
    title: "Seller Advisory",
    description: "Tailored positioning, photography and discreet marketing for architecturally significant homes.",
  },
  {
    icon: TrendingUp,
    title: "Market Valuation",
    description: "Data-driven pricing grounded in comparable sales and local coastal market trends.",
  },
  {
    icon: Compass,
    title: "Private Tours",
    description: "Scheduled, one-on-one viewings with a specialist who knows each property in detail.",
  },
  {
    icon: ShieldCheck,
    title: "Due Diligence",
    description: "Coordination of inspections, coastal regulations, permits and title review.",
  },
  {
    icon: Sparkles,
    title: "Concierge Relocation",
    description: "Move-in support, from trusted contractors and designers to property management.",
  },
];

// --- HERO SLIDES DATA ---
type HeroSlide = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  tagline: string;
  image: string;
  /** Property detail page; only set for slides built from Firestore properties. */
  href?: string;
};

/** Builds a hero slide from a Firestore property document. */
function toSlide(id: string, d: DocumentData): HeroSlide {
  const sentence = String(d.description ?? '').split(/(?<=[.!?])\s/)[0].trim();
  const tagline = sentence
    ? sentence.length > 110
      ? `${sentence.slice(0, 107).trimEnd()}…`
      : sentence
    : `${(operationLabels as Record<string, string>)[d.operation] ?? ''} · ${(typeLabels as Record<string, string>)[d.type] ?? ''}`;
  return {
    id,
    href: `/properties/${id}`,
    title: String(d.title ?? ''),
    location: [d.location?.city, d.location?.state].filter(Boolean).join(', '),
    price: formatMoney(Number(d.price) || 0, String(d.currency ?? 'USD')),
    tagline,
    image: ikUrl(String(d.photos?.[0]?.url ?? ''), 'w-2000,q-80,f-auto'),
  };
}

// Shown until featured properties load (or if there are none yet).
const fallbackSlides: HeroSlide[] = [
  {
    id: 1,
    title: "The Horizon Villa",
    location: "Big Sur, California",
    price: "$14,500,000",
    tagline: "Absolute privacy meets endless Pacific views.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Cliffside Sanctuary",
    location: "Malibu, California",
    price: "$9,800,000",
    tagline: "Suspended between sky and sea.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "The Glass Pavilion",
    location: "Carmel-by-the-Sea",
    price: "$11,200,000",
    tagline: "Seamless architectural integration with nature.",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Ocean Blue Estate",
    location: "Laguna Beach, California",
    price: "$18,500,000",
    tagline: "Timeless luxury on the water's edge.",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "The Dune House",
    location: "Monterey, California",
    price: "$7,400,000",
    tagline: "Minimalist living shaped by coastal winds.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop",
  },
];

// --- HARDCODED PROPERTIES (Bento Grid) ---
type HomeProperty = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  /** Detail page; only set for properties stored in Firestore. */
  href?: string;
};

const fallbackProperties: HomeProperty[] = [
  {
    id: 1,
    title: "The Horizon Villa",
    location: "Big Sur, CA",
    price: "$14,500,000",
    beds: 5,
    baths: 6,
    area: "6,200 sqft",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Cliffside Sanctuary",
    location: "Malibu, CA",
    price: "$9,800,000",
    beds: 4,
    baths: 4.5,
    area: "4,500 sqft",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "The Glass Pavilion",
    location: "Carmel, CA",
    price: "$11,200,000",
    beds: 3,
    baths: 3.5,
    area: "3,900 sqft",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Ocean Blue Estate",
    location: "Laguna Beach, CA",
    price: "$18,500,000",
    beds: 6,
    baths: 7,
    area: "8,100 sqft",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "The Dune House",
    location: "Monterey, CA",
    price: "$7,400,000",
    beds: 3,
    baths: 3,
    area: "3,200 sqft",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Pacific Horizon",
    location: "Pebble Beach, CA",
    price: "$12,900,000",
    beds: 4,
    baths: 5,
    area: "5,100 sqft",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Redwood Terrace",
    location: "Mendocino, CA",
    price: "$6,900,000",
    beds: 4,
    baths: 4,
    area: "4,100 sqft",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Tidewater House",
    location: "Santa Barbara, CA",
    price: "$10,600,000",
    beds: 5,
    baths: 5.5,
    area: "5,400 sqft",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Driftwood Retreat",
    location: "La Jolla, CA",
    price: "$13,400,000",
    beds: 5,
    baths: 6,
    area: "5,800 sqft",
    image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?q=80&w=800&auto=format&fit=crop",
  },
];

const parsePrice = (price: string) => Number(price.replace(/[^0-9]/g, ''));
const priceOptions = [8_000_000, 10_000_000, 12_000_000, 15_000_000];

export default function CoastalWebHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [properties, setProperties] = useState<HomeProperty[]>(fallbackProperties);
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile only; filters are always visible on md+
  const [lead, setLead] = useState({ name: '', email: '', property: '', message: '' });
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Load active properties from Firestore; keep the sample properties if none exist yet.
  useEffect(() => {
    if (!db) return;
    getDocs(fsQuery(collection(db, 'properties'), where('status', '==', 'active')))
      .then((snap) => {
        const loaded: HomeProperty[] = snap.docs
          .map((d) => ({ id: d.id, d: d.data() }))
          .sort((a, b) => (b.d.createdAt?.toMillis?.() ?? 0) - (a.d.createdAt?.toMillis?.() ?? 0))
          .map(({ id, d }) => ({
            id,
            href: `/properties/${id}`,
            title: String(d.title ?? ''),
            location: [d.location?.city, d.location?.state].filter(Boolean).join(', '),
            price: formatMoney(Number(d.price) || 0, String(d.currency ?? 'USD')),
            beds: Number(d.specs?.bedrooms) || 0,
            baths: Number(d.specs?.bathrooms) || 0,
            area: `${(Number(d.specs?.areaM2) || 0).toLocaleString('en-US')} m²`,
            image: String(d.photos?.[0]?.url ?? ''),
          }));
        if (loaded.length) setProperties(loaded);

        // Hero: featured properties (newest first, max 5). If none are featured yet,
        // use the newest active properties so the hero is never empty.
        const sorted = snap.docs
          .map((d) => ({ id: d.id, d: d.data() }))
          .sort((a, b) => (b.d.createdAt?.toMillis?.() ?? 0) - (a.d.createdAt?.toMillis?.() ?? 0));
        const featured = sorted.filter((x) => x.d.featured === true);
        const picked = (featured.length ? featured : sorted).slice(0, 5);
        if (picked.length) {
          setSlides(picked.map((x) => toSlide(x.id, x.d)));
          setCurrentSlide(0);
        }
      })
      .catch(() => {
        /* keep sample properties */
      });
  }, []);

  const locations = Array.from(new Set(properties.map((p) => p.location)));

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      setLeadState('error');
      return;
    }
    setLeadState('sending');
    try {
      await addDoc(collection(db, 'leads'), {
        name: lead.name.trim(),
        email: lead.email.trim(),
        property: lead.property || 'General Representation',
        message: lead.message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setLead({ name: '', email: '', property: '', message: '' });
      setLeadState('sent');
    } catch {
      setLeadState('error');
    }
  };

  const [locationFilter, setLocationFilter] = useState('all');
  const [minBeds, setMinBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0); // 0 = any

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    const matchesQuery =
      !normalizedQuery || `${p.title} ${p.location}`.toLowerCase().includes(normalizedQuery);
    const matchesLocation = locationFilter === 'all' || p.location === locationFilter;
    const matchesBeds = p.beds >= minBeds;
    const matchesPrice = maxPrice === 0 || parsePrice(p.price) <= maxPrice;
    return matchesQuery && matchesLocation && matchesBeds && matchesPrice;
  });
  const hasActiveFilters =
    normalizedQuery !== '' || locationFilter !== 'all' || minBeds !== 0 || maxPrice !== 0;
  const resetFilters = () => {
    setQuery('');
    setLocationFilter('all');
    setMinBeds(0);
    setMaxPrice(0);
  };

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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">Coastal.</span>
          <nav className="hidden md:flex items-center space-x-8 text-sm text-[#515154]">
            <a href="#properties" className="hover:text-[#1D1D1F] transition-colors">Properties</a>
            <a href="#vision" className="hover:text-[#1D1D1F] transition-colors">Vision</a>
            <a href="#contact" className="hover:text-[#1D1D1F] transition-colors">Inquire</a>
          </nav>
          <a
            href="#contact"
            className="bg-[#1D1D1F] text-[#FFFFFF] text-xs font-medium px-4 py-2 rounded-full hover:bg-[#333336] transition-all"
          >
            Private Tour
          </a>
        </div>
      </header>

      {/* --- HERO SLIDESHOW (5-slide full-width) --- */}
      <section className="relative w-full h-[90vh] md:h-screen overflow-hidden">
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
      <section id="search" className="px-6 max-w-7xl mx-auto h-0 relative z-30">
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or location…"
              aria-label="Search properties"
              className="min-w-0 flex-1 bg-transparent px-2 md:px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-label="Toggle filters"
              aria-expanded={filtersOpen}
              aria-controls="search-filters"
              className={`md:hidden relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                filtersOpen ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && !filtersOpen && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1D1D1F] ring-2 ring-white" />
              )}
            </button>
            <button
              type="submit"
              aria-label="Search"
              className="shrink-0 bg-[#1D1D1F] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#333336] transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>

          {/* Filters */}
          <div
            id="search-filters"
            className={`${filtersOpen ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-3 px-3 pb-1 pt-3 border-t border-[#000000]/5 text-xs`}
          >
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filter by location"
              className="bg-[#F5F5F7] rounded-full px-4 py-2.5 text-[#1D1D1F] outline-none cursor-pointer"
            >
              <option value="all">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={minBeds}
              onChange={(e) => setMinBeds(Number(e.target.value))}
              aria-label="Minimum bedrooms"
              className="bg-[#F5F5F7] rounded-full px-4 py-2.5 text-[#1D1D1F] outline-none cursor-pointer"
            >
              <option value={0}>Any beds</option>
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}+ beds</option>
              ))}
            </select>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Maximum price"
              className="bg-[#F5F5F7] rounded-full px-4 py-2.5 text-[#1D1D1F] outline-none cursor-pointer"
            >
              <option value={0}>Any price</option>
              {priceOptions.map((n) => (
                <option key={n} value={n}>Up to ${n / 1_000_000}M</option>
              ))}
            </select>
            <span className="text-[#515154] ml-auto">
              {filteredProperties.length} of {properties.length} residences
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#1D1D1F] underline underline-offset-2 hover:text-[#515154]"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </section>

      {/* --- BODY: PROPERTY BENTO GRID --- */}
      <section id="properties" className="pt-20 md:pt-32 pb-44 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProperties.length === 0 && (
            <p className="col-span-full text-center text-[#515154] text-sm">
              No residences match your search and filters.
            </p>
          )}
          {filteredProperties.map((prop) => {
            const cardClass =
              'group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-8 transition-transform duration-500 hover:-translate-y-1';
            const content = (
              <>
              {/* Background Image */}
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <PropertyImage
                  src={prop.image}
                  alt={`${prop.title}, ${prop.location}`}
                  variant="card"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Top Details (Price Badge) */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                <span className="bg-white/90 backdrop-blur-md text-black text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
                  {prop.price}
                </span>
                <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              {/* Bottom Details */}
              <div className="relative z-10 text-white">
                <p className="text-xs text-white/70 font-medium tracking-wide uppercase mb-1">{prop.location}</p>
                <h3 className="text-2xl font-semibold tracking-tight mb-4">{prop.title}</h3>

                {/* Specifications Bar */}
                <div className="flex items-center space-x-6 pt-4 border-t border-white/20 text-xs text-white/80 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Bed className="w-4 h-4" />
                    <span>{prop.beds} Beds</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Bath className="w-4 h-4" />
                    <span>{prop.baths} Baths</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Maximize className="w-4 h-4" />
                    <span>{prop.area}</span>
                  </div>
                </div>
              </div>
              </>
            );
            return prop.href ? (
              <Link key={prop.id} href={prop.href} className={cardClass} aria-label={`View ${prop.title}`}>
                {content}
              </Link>
            ) : (
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
            <span>See all properties</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <a
            href="#search"
            className="justify-self-center inline-flex items-center space-x-2 bg-[#1D1D1F] text-white text-xs font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Advanced search</span>
          </a>
          <p className="justify-self-center md:justify-self-end text-xs text-[#515154]">
            Showing {filteredProperties.length} of {properties.length} properties
          </p>
        </div>
      </section>

      {/* --- FOCUS AREAS --- */}
      <section id="areas" className="pb-44 px-6 max-w-7xl mx-auto">
        <div className="max-w-xl mb-16">
          <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">Areas We Focus On</h2>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight">
            Six stretches of coastline, known intimately.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <button
              key={zone.name}
              type="button"
              onClick={() => {
                setQuery(zone.search);
                document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#E5E5EA] text-left p-8 flex flex-col justify-end transition-transform duration-500 hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${zone.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-black text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
                {(() => {
                  const count = properties.filter((p) =>
                    p.location.toLowerCase().includes(zone.search.toLowerCase())
                  ).length;
                  return `${count} ${count === 1 ? 'property' : 'properties'}`;
                })()}
              </span>
              <span className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <div className="relative z-10 text-white">
                <h3 className="text-2xl font-semibold tracking-tight mb-1">{zone.name}</h3>
                <p className="text-sm text-white/80 font-light">{zone.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --- WHO WE ARE --- */}
      <section id="vision" className="pb-44 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold">Who We Are</h2>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight">
              A boutique brokerage devoted to the Pacific Coast.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Coastal represents a small, carefully chosen collection of architectural residences
              from Mendocino to La Jolla. We work with a limited number of clients at a time, so
              every acquisition and every sale gets our full attention.
            </p>
            <p className="text-[#515154] font-light leading-relaxed">
              Our team combines deep local knowledge with a passion for design, guiding buyers
              through each step with discretion, precision and care.
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
                'url(https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1200&auto=format&fit=crop)',
            }}
          />
        </div>
      </section>

      {/* --- SERVICES --- */}
      <section id="services" className="pb-44 px-6 max-w-7xl mx-auto">
        <div className="max-w-xl mb-16">
          <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">Our Services</h2>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight">
            Everything you need, handled with care.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="aspect-[4/3] flex flex-col rounded-2xl bg-white border border-[#000000]/5 p-8 shadow-sm transition-transform duration-500 hover:-translate-y-1"
            >
              <span className="w-11 h-11 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-auto">
                <Icon className="w-5 h-5 text-[#1D1D1F]" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight mb-2">{title}</h3>
              <p className="text-sm text-[#515154] font-light leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- TEAM --- */}
      <section id="team" className="pb-44 px-6 max-w-7xl mx-auto">
        <div className="max-w-xl mb-16">
          <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">Our Team</h2>
          <p className="text-3xl md:text-4xl font-semibold tracking-tight">
            The people behind every residence.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member) => (
            <div key={member.name}>
              <div
                className="aspect-square rounded-2xl bg-cover bg-center bg-[#E5E5EA] mb-4"
                style={{ backgroundImage: `url(${member.image})` }}
                role="img"
                aria-label={member.name}
              />
              <h3 className="text-base font-semibold tracking-tight">{member.name}</h3>
              <p className="text-xs text-[#515154] font-light mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CALL TO ACTION & CONTACT FORM --- */}
      <section id="contact" className="py-44 px-6 bg-[#F2F2F7] border-t border-b border-[#000000]/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left Column: Company Data & Value Prop */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-3">Private Acquisition</h2>
            <p className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
              Begin your journey to exceptional coastal living.
            </p>
            <p className="text-[#515154] font-light leading-relaxed mb-12">
              Our advisors operate with absolute discretion, representing premier architectural landmarks along the Pacific coastline. Connect with us to schedule a private viewing or list a distinguished property.
            </p>

            <div className="space-y-6 pt-6 border-t border-[#000000]/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1D1D1F]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#515154] uppercase tracking-wider font-semibold">Headquarters</p>
                  <p className="text-sm font-medium">101 Ocean Avenue, Carmel-by-the-Sea, CA</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1D1D1F]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#515154] uppercase tracking-wider font-semibold">Direct Inquiry</p>
                  <p className="text-sm font-medium">concierge@coastalweb.estate</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1D1D1F]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#515154] uppercase tracking-wider font-semibold">Telephone</p>
                  <p className="text-sm font-medium">+1 (831) 555-0199</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Minimalist Contact Form */}
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#000000]/5">
            <form onSubmit={submitLead} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Jonathan Vance"
                  className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="jonathan@vance.com"
                  className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Property of Interest</label>
                <select
                  value={lead.property}
                  onChange={(e) => setLead({ ...lead, property: e.target.value })}
                  className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors text-[#1D1D1F]"
                >
                  <option value="">General Representation</option>
                  {properties.map((p) => (
                    <option key={p.id} value={`${p.title}, ${p.location}`}>
                      {p.title}, {p.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Message</label>
                <textarea
                  rows={4}
                  value={lead.message}
                  onChange={(e) => setLead({ ...lead, message: e.target.value })}
                  placeholder="Share your timeline or specific requirements..."
                  className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={leadState === 'sending'}
                className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-[#333336] transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <span>{leadState === 'sending' ? 'Sending…' : 'Submit Inquiry'}</span>
                <Send className="w-4 h-4" />
              </button>
              {leadState === 'sent' && (
                <p role="status" className="text-sm text-green-700 text-center">
                  Thank you — an advisor will be in touch shortly.
                </p>
              )}
              {leadState === 'error' && (
                <p role="alert" className="text-sm text-red-600 text-center">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}
            </form>
          </div>

        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
