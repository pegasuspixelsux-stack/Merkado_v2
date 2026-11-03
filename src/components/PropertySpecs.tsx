import { Bath, Bed, Building2, Car, Maximize, MapPin, Tag } from 'lucide-react';
import type { Property } from '../types/firestore';
import { formatPriceWithCode, operationLabels, typeLabels } from '../utils/format';

/** Location header, price badge and the high-density attribute bar. */
export default function PropertySpecs({
  property: p,
  showHeader = true,
}: {
  property: Property;
  /** Show the location, title and price header above the metrics bar. Default: true. */
  showHeader?: boolean;
}) {
  const place = [p.location.neighborhood, p.location.city].filter(Boolean).join(', ');
  const metrics = [
    { label: 'Operation', value: operationLabels[p.operation], icon: Tag },
    { label: 'Type', value: typeLabels[p.type], icon: Building2 },
    { label: 'Total area', value: `${p.specs.areaM2.toLocaleString('en-US')} m²`, icon: Maximize },
    { label: 'Bedrooms', value: String(p.specs.bedrooms), icon: Bed },
    { label: 'Bathrooms', value: String(p.specs.bathrooms), icon: Bath },
    { label: 'Garages', value: p.specs.parkingSpaces === undefined ? '—' : String(p.specs.parkingSpaces), icon: Car },
  ];

  return (
    <section aria-label="Property highlights">
      {showHeader && (
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-[#515154] font-medium tracking-wide uppercase mb-3">
            <MapPin className="w-4 h-4" />
            <span>{place || p.location.country}</span>
            {p.location.state && <span className="text-[#86868B]">· {p.location.state}</span>}
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{p.title}</h1>
        </div>
        <div className="bg-[#1D1D1F] text-white rounded-2xl px-6 py-4 shrink-0">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-1">
            {p.operation === 'sale' ? 'Price' : p.operation === 'rent' ? 'Rent / month' : 'Seasonal rate'}
          </p>
          <p className="text-2xl md:text-3xl font-semibold tracking-tight">
            {formatPriceWithCode(p.price, p.currency)}
          </p>
        </div>
      </div>
      )}

      <dl className={`${showHeader ? 'mt-8' : ''} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px rounded-2xl overflow-hidden bg-[#000000]/5 border border-[#000000]/5`}>
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-5">
            <Icon className="w-4 h-4 text-[#515154] mb-3" />
            <dd className="text-lg font-semibold tracking-tight">{value}</dd>
            <dt className="text-xs uppercase tracking-wider text-[#515154] font-semibold mt-1">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
