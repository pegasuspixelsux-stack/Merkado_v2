'use client';

import Link from 'next/link';
import { Clock, FileText, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import { whatsappUrl } from '@/src/utils/format';
import BrandName from '@/src/components/BrandName';

const linkClass = 'hover:text-white transition-colors';

/** The four-column site footer, shared by the homepage and the item pages. */
export default function SiteFooter() {
  const business = useBusiness();
  const wa = business.whatsapp ? whatsappUrl(business.whatsapp, 'Hola, quiero consultar por el catálogo.') : null;
  const hasContact = Boolean(
    business.address || business.email || business.whatsapp || business.phone || business.hours || business.rut || business.license,
  );
  return (
    <footer className="bg-[#000000] text-[#FBFBFD] py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <span className="text-lg font-semibold tracking-tight text-white"><BrandName /></span>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            Frutas y verduras frescas, directo del productor a tu negocio o a tu mesa.
          </p>

          {hasContact && (
            <ul className="space-y-3 pt-2 text-xs text-white/80 font-light" aria-label="Contacto">
              {business.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  <span>{business.address}</span>
                </li>
              )}
              {business.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  <a href={`mailto:${business.email}`} className={linkClass}>{business.email}</a>
                </li>
              )}
              {business.whatsapp && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>{business.whatsapp} (WhatsApp)</a>
                  ) : (
                    <span>{business.whatsapp} (WhatsApp)</span>
                  )}
                </li>
              )}
              {business.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  <a href={`tel:${business.phone.replace(/[^+\d]/g, '')}`} className={linkClass}>{business.phone}</a>
                </li>
              )}
              {business.hours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  <span className="whitespace-pre-line">{business.hours}</span>
                </li>
              )}
              {(business.rut || business.license) && (
                <li className="flex items-start gap-3">
                  <FileText className="w-4 h-4 shrink-0 text-white/50" aria-hidden="true" />
                  <span>{[business.rut && `RUT ${business.rut}`, business.license && `Habilitación ${business.license}`].filter(Boolean).join(' · ')}</span>
                </li>
              )}
            </ul>
          )}
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
