'use client';

import Link from 'next/link';
import BrandName from '@/src/components/BrandName';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import WholesaleAccess from '@/src/components/WholesaleAccess';

/** Cover: a full-screen hero with the headline and the two entry buttons (working name, to be renamed). */
export default function CoverPage() {
  return (
    <div className="min-h-svh bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></Link>
          <SiteNavLinks />
          <div className="flex items-center gap-3">
            <WholesaleAccess />
            <MobileNavMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 flex px-3 md:px-6 pb-3 md:pb-6">
        <section className="relative flex-1 w-full max-w-[1440px] mx-auto overflow-hidden rounded-3xl border border-[#2E7D32] bg-[#2E7D32] text-white flex items-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2000&auto=format&fit=crop)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#2E7D32] md:bg-transparent md:bg-gradient-to-r md:from-[#2E7D32] md:from-[55%] md:via-[#2E7D32]/55 md:via-[80%] md:to-transparent"
          />
          <div className="relative w-full px-6 md:px-14 py-12">
            <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase">
              Distribución hortifrutícola B2B
            </span>
            <h1 className="mt-5 max-w-4xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.08]">
              El distribuidor hortifrutícola para la gastronomía de Punta del Este.
            </h1>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/items"
                className="inline-flex items-center justify-center rounded-full bg-white text-[#1D1D1F] px-7 py-3.5 text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
              >
                Acceder al Catálogo Mayorista
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center rounded-full border border-white/70 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all"
              >
                Solicitar acceso mayorista
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
