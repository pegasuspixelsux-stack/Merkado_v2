'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandName, { DEFAULT_LOGO } from '@/src/components/BrandName';
import { useBusiness } from '@/src/context/BusinessContext';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import WholesaleAccess from '@/src/components/WholesaleAccess';

/** Counts from 0 up to `to` once it is on screen (no animation for people who prefer reduced motion). */
function CountUp({ to, suffix = '', duration = 4000 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the final number without animating
      setValue(to);
      return;
    }
    let frame = 0;
    const start = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        start();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);
  return (
    <span ref={ref} aria-label={`${to}${suffix}`}>
      <span aria-hidden="true">{value}{suffix}</span>
    </span>
  );
}

/** Cover: a full-screen hero with the headline and the two entry buttons (working name, to be renamed). */
export default function CoverPage() {
  const { logo } = useBusiness();
  const router = useRouter();
  // The homepage sections (Quiénes somos, FAQ, Contacto) live in the catalog for phones: send those links there.
  useEffect(() => {
    const go = () => {
      const h = window.location.hash;
      if (h === '#vision' || h === '#faq' || h === '#contact') router.replace(`/items${h}`);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [router]);
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
        <section className="relative flex-1 w-full max-w-[1440px] mx-auto overflow-hidden rounded-3xl border border-[#2E7D32] bg-[#2E7D32] text-white flex items-end">
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
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2E7D32]/95 via-[35%] to-[#2E7D32]"
          />
          <div className="relative w-full px-6 md:px-14 pt-12 pb-12 md:pb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo || DEFAULT_LOGO} alt="" aria-hidden="true" className="-mt-8 md:-mt-12 -mb-3 md:-mb-4 mx-auto md:mx-0 h-48 w-48 md:h-[269px] md:w-[269px] max-w-full object-contain drop-shadow-lg" />
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
                href="/items#contact"
                className="inline-flex items-center justify-center rounded-full border border-white/70 text-white px-7 py-3.5 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all"
              >
                Solicitar acceso mayorista
              </Link>
            </div>
            <div className="mt-10 md:mt-14 grid grid-cols-2 gap-6 md:gap-10 max-w-3xl border-t border-white/25 pt-6 md:pt-8">
              {[
                { value: 100, label: 'Productos' },
                { value: 300, label: 'Clientes' },
              ].map((n) => (
                <div key={n.label}>
                  <p className="text-[58px] sm:text-[77px] md:text-[96px] font-light tracking-tight leading-none tabular-nums"><CountUp to={n.value} suffix="+" /></p>
                  <p className="mt-2 text-base sm:text-xl md:text-2xl text-white/85 font-light">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/"
            className="absolute bottom-3 inset-x-0 text-center text-xs text-white/70 hover:text-white transition-colors"
          >
            Merkado v 2.0
          </Link>
        </section>
      </main>
    </div>
  );
}
