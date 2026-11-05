import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

const linkClass = 'hover:text-white transition-colors';

/** The four-column site footer, shared by the homepage and the item pages. */
export default function SiteFooter() {
  return (
    <footer className="bg-[#000000] text-[#FBFBFD] py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <span className="text-lg font-semibold tracking-tight text-white">Merkado<span className="sm:hidden"> M</span><span className="hidden sm:inline"> para Mayoristas</span>.</span>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            Frutas y verduras frescas, directo del productor a tu negocio o a tu mesa.
          </p>

          <ul className="space-y-3 pt-2 text-xs text-white/80 font-light" aria-label="Contacto">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
              <span>101 Ocean Avenue, Carmel-by-the-Sea, CA</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
              <a href="mailto:contacto@merkado.uy" className={linkClass}>contacto@merkado.uy</a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
              <a href="tel:+18315550199" className={linkClass}>+1 (831) 555-0199</a>
            </li>
          </ul>
        </div>

        {/* Column 2: Inventory */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Catálogo</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><Link href="/#properties" className={linkClass}>Frutas</Link></li>
            <li><Link href="/#properties" className={linkClass}>Verduras</Link></li>
            <li><Link href="/#properties" className={linkClass}>Hojas verdes</Link></li>
            <li><Link href="/#properties" className={linkClass}>Tropicales</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Empresa</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><Link href="/#vision" className={linkClass}>Quiénes somos</Link></li>
            <li><Link href="/#contact" className={linkClass}>Mayoristas</Link></li>
            <li><Link href="/#contact" className={linkClass}>Contacto</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal & Notice */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">Legal</p>
          <ul className="space-y-2.5 text-xs text-white/80 font-light">
            <li><a href="#" className={linkClass}>Política de privacidad</a></li>
            <li><Link href="/creditos" className={linkClass}>Créditos de fotos</Link></li>
            <li><a href="#" className={linkClass}>Términos del servicio</a></li>
            <li><Link href="/admin/login" className={linkClass}>Administración</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 font-light">
        <p>&copy; {new Date().getFullYear()} Merkado Inc. Todos los derechos reservados.</p>
        <p className="mt-4 md:mt-0">Diseñado con atención a cada detalle.</p>
      </div>
    </footer>
  );
}
