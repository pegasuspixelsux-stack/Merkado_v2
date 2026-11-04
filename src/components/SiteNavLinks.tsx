import Link from 'next/link';

const links = [
  { href: '/items', label: 'Catálogo' },
  { href: '/#vision', label: 'Quiénes somos' },
  { href: '/#contact', label: 'Contacto' },
];

/** Top-navigation links shared by the homepage, catalog and item pages (desktop; mobile uses the footer links). */
export default function SiteNavLinks() {
  return (
    <nav aria-label="Principal" className="hidden md:flex items-center gap-8 text-sm text-[#515154]">
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="hover:text-[#1D1D1F] transition-colors">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
