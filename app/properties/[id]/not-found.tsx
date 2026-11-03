import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

// High-contrast 404 for properties that don't exist or aren't publicly listed.
export default function PropertyNotFound() {
  return (
    <main className="min-h-screen bg-[#1D1D1F] text-white flex items-center justify-center px-6 font-sans antialiased">
      <div className="max-w-lg text-center">
        <p className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-6">Coastal.</p>
        <h1 className="text-7xl md:text-9xl font-semibold tracking-tight mb-6">404</h1>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">This residence isn’t available.</p>
        <p className="text-white/70 font-light leading-relaxed mb-10">
          The property may have been sold, withdrawn or never existed. Explore our current collection or speak with an advisor.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/#properties"
            className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-white/90 transition-all"
          >
            <span>View all properties</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center border border-white/30 px-6 py-3 rounded-full text-sm font-medium hover:bg-white/10 transition-all"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
