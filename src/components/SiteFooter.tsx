import Link from 'next/link';

const linkClass = 'hover:text-white transition-colors';

/** The four-column site footer, shared by the homepage and the property pages. */
export default function SiteFooter() {
  return (
    <footer className="bg-[#1D1D1F] text-[#FBFBFD] py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <span className="text-lg font-semibold tracking-tight text-white">Coastal.</span>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            Redefining architectural property acquisition along the Pacific Coast with absolute precision and elegance.
          </p>
        </div>

        {/* Column 2: Portfolio */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Portfolio</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><Link href="/#properties" className={linkClass}>Big Sur Residences</Link></li>
            <li><Link href="/#properties" className={linkClass}>Malibu Estates</Link></li>
            <li><Link href="/#properties" className={linkClass}>Carmel Architecture</Link></li>
            <li><Link href="/#properties" className={linkClass}>Laguna Beachfront</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Company</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><Link href="/#vision" className={linkClass}>Our Vision</Link></li>
            <li><Link href="/#contact" className={linkClass}>Advisory Board</Link></li>
            <li><Link href="/#contact" className={linkClass}>Press &amp; Awards</Link></li>
            <li><Link href="/#contact" className={linkClass}>Careers</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal & Notice */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Legal</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><a href="#" className={linkClass}>Privacy Policy</a></li>
            <li><a href="#" className={linkClass}>Terms of Service</a></li>
            <li><a href="#" className={linkClass}>Brokerage License #0291918</a></li>
            <li><Link href="/admin/login" className={linkClass}>Admin</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 font-light">
        <p>&copy; {new Date().getFullYear()} Coastal Web Estate Inc. All rights reserved.</p>
        <p className="mt-4 md:mt-0">Designed with Apple-level attention to detail.</p>
      </div>
    </footer>
  );
}
