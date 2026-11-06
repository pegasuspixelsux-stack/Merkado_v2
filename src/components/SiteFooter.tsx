'use client';

import Link from 'next/link';
import { Clock, FileText, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import { useCategories } from '@/src/hooks/useCategories';
import { socialLinks } from '@/src/components/SocialIcons';
import { whatsappUrl } from '@/src/utils/format';
import BrandName from '@/src/components/BrandName';

const linkClass = 'hover:text-white hover:underline underline-offset-2 transition-colors';

/** The four-column site footer, shared by the homepage and the item pages. */
export default function SiteFooter() {
  const business = useBusiness();
  const socials = socialLinks(business);
  const { categories } = useCategories();
  const wa = business.whatsapp ? whatsappUrl(business.whatsapp, 'Hola, quiero consultar por el catálogo.') : null;
  const hasContact = Boolean(
    business.address || business.email || business.whatsapp || business.phone || business.hours || business.rut || business.license,
  );
  return (
    <footer className="bg-[#2E7D32] text-white pt-12 pb-32 md:pt-32 px-6">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 mb-16">
        {/* Column 1: Brand (tablets, portrait and landscape: its own full-width row) */}
        <div className="space-y-4 md:col-span-2 xl:col-span-1">
          <span className="text-sm min-[420px]:text-base sm:text-lg md:text-2xl font-semibold tracking-tight text-white"><BrandName /></span>
          <p className="text-sm md:text-base text-white/80 leading-relaxed font-light">
            Frutas y verduras frescas, directo del productor a tu negocio o a tu mesa.
          </p>

          {hasContact && (
            <ul className="space-y-3 pt-2 text-sm md:text-base text-white/90 font-light" aria-label="Contacto">
              {business.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  <span>{business.address}</span>
                </li>
              )}
              {business.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  <a href={`mailto:${business.email}`} className={linkClass}>{business.email}</a>
                </li>
              )}
              {business.whatsapp && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>{business.whatsapp} (WhatsApp)</a>
                  ) : (
                    <span>{business.whatsapp} (WhatsApp)</span>
                  )}
                </li>
              )}
              {business.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  <a href={`tel:${business.phone.replace(/[^+\d]/g, '')}`} className={linkClass}>{business.phone}</a>
                </li>
              )}
              {business.hours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  <span className="whitespace-pre-line">{business.hours}</span>
                </li>
              )}
              {(business.rut || business.license) && (
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 shrink-0 text-white/80" aria-hidden="true" />
                  <span>{[business.rut && `RUT ${business.rut}`, business.license && `Habilitación ${business.license}`].filter(Boolean).join(' · ')}</span>
                </li>
              )}
            </ul>
          )}
          {socials.length > 0 && (
            <div className="flex items-center gap-2 pt-2" aria-label="Redes sociales">
              {socials.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Inventory */}
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-white/80 font-semibold">Catálogo</p>
          <ul className="space-y-3 text-sm md:text-base text-white/90 font-light">
            {categories.slice(0, 4).map((c) => (
              <li key={c.id}><Link href={`/items?category=${encodeURIComponent(c.id)}`} className={linkClass}>{c.name}</Link></li>
            ))}
            <li><Link href="/items" className={`${linkClass} font-medium`}>Ver todo el catálogo →</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-white/80 font-semibold">Empresa</p>
          <ul className="space-y-3 text-sm md:text-base text-white/90 font-light">
            <li><Link href="/#vision" className={linkClass}>Quiénes somos</Link></li>
            <li><Link href="/#faq" className={linkClass}>Preguntas frecuentes</Link></li>
            <li><Link href="/#contact" className={linkClass}>Mayoristas</Link></li>
            <li><Link href="/#contact" className={linkClass}>Contacto</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal & Notice */}
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-white/80 font-semibold">Legal</p>
          <ul className="space-y-3 text-sm md:text-base text-white/90 font-light">
            <li><Link href="/privacidad" className={linkClass}>Política de privacidad</Link></li>
            <li><Link href="/creditos" className={linkClass}>Créditos de fotos</Link></li>
            <li><a href="#" className={linkClass}>Términos del servicio</a></li>
            <li><Link href="/admin/login" className={linkClass}>Administración</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between text-sm md:text-base text-white/80 font-light">
        <p>&copy; {new Date().getFullYear()} Merkado Inc. Todos los derechos reservados.</p>
        <p className="mt-4 md:mt-0">
          Sitio web por{' '}
          <a
            href="https://www.pegasuspixels.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white underline underline-offset-2 hover:no-underline"
          >
            PegasusPixels
          </a>
        </p>
      </div>
    </footer>
  );
}
