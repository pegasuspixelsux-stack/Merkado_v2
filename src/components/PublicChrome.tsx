import Link from 'next/link';

/** Slim site header for public pages beyond the homepage (matches the homepage nav). */
export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-[#000000]/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Coastal.
        </Link>
        <nav className="hidden md:flex items-center space-x-8 text-sm text-[#515154]">
          <Link href="/#properties" className="hover:text-[#1D1D1F] transition-colors">Properties</Link>
          <Link href="/#vision" className="hover:text-[#1D1D1F] transition-colors">Vision</Link>
          <Link href="/#contact" className="hover:text-[#1D1D1F] transition-colors">Inquire</Link>
        </nav>
        <Link
          href="/#contact"
          className="bg-[#1D1D1F] text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-[#333336] transition-all"
        >
          Private Tour
        </Link>
      </div>
    </header>
  );
}
