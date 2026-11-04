'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../ImageUpload';
import PropertyImage from '../PropertyImage';
import { DELIVERY_AREAS, type DeliveryArea, type Property, type PropertyInput, type PropertyPhoto } from '../../types/firestore';
import { unitLabels, weightUnits } from '../../utils/format';
import { useCategories } from '../../hooks/useCategories';
import { cardClass, inputClass, labelClass } from './ui';

interface FormState {
  title: string;
  description: string;
  weight: string;
  unit: string;
  price: string;
  wholesalePrice: string;
  boxWeight: string;
  boxPrice: string;
  deliveryAreas: DeliveryArea[];
  category: string;
  inStock: boolean;
  featured: boolean;
  onSale: boolean;
  salePrice: string;
  photo: PropertyPhoto | null;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  weight: '',
  unit: 'kg',
  price: '',
  wholesalePrice: '',
  boxWeight: '',
  boxPrice: '',
  deliveryAreas: ['Maldonado'],
  category: 'fruit',
  inStock: true,
  featured: false,
  onSale: false,
  salePrice: '',
  photo: null,
};

function fromProperty(p: Property): FormState {
  return {
    title: p.title,
    description: p.description,
    weight: p.weight === undefined ? '' : String(p.weight),
    unit: p.unit ?? 'kg',
    price: String(p.price),
    wholesalePrice: p.wholesalePrice === undefined ? '' : String(p.wholesalePrice),
    boxWeight: p.boxWeight === undefined ? '' : String(p.boxWeight),
    boxPrice: p.boxPrice === undefined ? '' : String(p.boxPrice),
    deliveryAreas: p.deliveryAreas?.length ? p.deliveryAreas : ['Maldonado'],
    category: p.type,
    inStock: p.inStock !== false,
    featured: p.featured ?? false,
    onSale: p.salePrice !== undefined,
    salePrice: p.salePrice === undefined ? '' : String(p.salePrice),
    photo: p.photos[0] ?? null,
  };
}

interface PropertyFormProps {
  /** Existing item when editing; omit to create a new one. */
  initial?: Property;
  submitLabel: string;
  onSubmit: (data: PropertyInput) => Promise<void>;
}

export default function PropertyForm({ initial, submitLabel, onSubmit }: PropertyFormProps) {
  const router = useRouter();
  const { agent } = useAuth();
  const { categories } = useCategories();
  const [form, setForm] = useState<FormState>(initial ? fromProperty(initial) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string | null => {
    if (!form.photo) return 'Subí una imagen.';
    if (!form.title.trim()) return 'Agregá un título.';
    if (!form.description.trim()) return 'Agregá una descripción.';
    const weight = Number(form.weight);
    if (form.weight === '' || Number.isNaN(weight) || weight <= 0) return 'Ingresá un peso mayor a 0.';
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) return 'Ingresá un precio válido.';
    if (form.wholesalePrice !== '') {
      const w = Number(form.wholesalePrice);
      if (Number.isNaN(w) || w < 0) return 'Ingresá un precio mayorista válido.';
      if (w > price) return 'El precio mayorista no puede ser mayor al minorista.';
    }
    if (form.boxWeight !== '') {
      const bw = Number(form.boxWeight);
      if (Number.isNaN(bw) || bw <= 0) return 'Ingresá un peso por caja mayor a 0.';
    }
    if (form.boxPrice !== '') {
      const bp = Number(form.boxPrice);
      if (Number.isNaN(bp) || bp < 0) return 'Ingresá un precio por caja válido.';
      if (form.boxWeight === '') return 'Para fijar un precio por caja, ingresá también el peso por caja.';
    }
    if (form.deliveryAreas.length === 0) return 'Elegí al menos una zona de entrega.';
    if (!form.category) return 'Elegí una categoría.';
    if (form.onSale) {
      const sale = Number(form.salePrice);
      if (form.salePrice === '' || Number.isNaN(sale) || sale < 0) return 'Ingresá un precio de oferta válido.';
      if (sale >= price) return 'El precio de oferta tiene que ser menor al precio normal.';
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !form.photo) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.category,
        weight: Number(form.weight),
        unit: form.unit,
        price: Number(form.price),
        wholesalePrice: form.wholesalePrice === '' ? undefined : Number(form.wholesalePrice),
        boxWeight: form.boxWeight === '' ? undefined : Number(form.boxWeight),
        boxPrice: form.boxWeight === '' || form.boxPrice === '' ? undefined : Number(form.boxPrice),
        deliveryAreas: form.deliveryAreas,
        inStock: form.inStock,
        // null clears a sale when editing (undefined keys are dropped by the service)
        salePrice: form.onSale ? Number(form.salePrice) : undefined,
        photos: [form.photo],
        // Not asked for in the simple form: keep what an existing item has, use defaults for new ones.
        operation: initial?.operation ?? 'sale',
        currency: initial?.currency ?? 'UYU',
        status: initial?.status ?? 'active',
        featured: form.featured,
        location: initial?.location ?? { city: '', country: '' },
        specs: initial?.specs ?? { bedrooms: 0, bathrooms: 0, areaM2: 0 },
        agentId: initial?.agentId ?? agent.id,
        agentName: initial ? initial.agentName : agent.name || undefined,
        agentPhone: initial ? initial.agentPhone : agent.phone || undefined,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'permission-denied'
          ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas y que el artículo sea tuyo.'
          : err instanceof Error
            ? err.message
            : 'No se pudo guardar el artículo.'
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl">
      <div className={`${cardClass} p-6 md:p-8 space-y-6`}>
        <div>
          <span className={labelClass}>Imagen</span>
          {form.photo ? (
            <div className="relative aspect-[4/3] max-w-sm rounded-2xl overflow-hidden bg-[#E5E5EA]">
              <PropertyImage src={form.photo.url} alt="Imagen del artículo" variant="thumb" sizes="384px" />
              <button
                type="button"
                onClick={() => set('photo', null)}
                aria-label="Quitar imagen"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <ImageUpload
              onUploaded={({ url, fileId }) => {
                set('photo', { url, fileId });
                setError(null);
              }}
              onError={setError}
            />
          )}
        </div>

        <div>
          <label htmlFor="i-title" className={labelClass}>Título</label>
          <input id="i-title" className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Tomates perita" />
        </div>

        <div>
          <label htmlFor="i-desc" className={labelClass}>Descripción</label>
          <textarea id="i-desc" rows={4} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Origen, sabor, cómo se cultiva y se empaca…" />
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="col-span-2">
            <label htmlFor="i-weight" className={labelClass}>Peso</label>
            <input id="i-weight" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="12" />
          </div>
          <div>
            <label htmlFor="i-unit" className={labelClass}>Unidad</label>
            <select id="i-unit" className={inputClass} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {weightUnits.map((u) => <option key={u} value={u}>{unitLabels[u]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="i-price" className={labelClass}>Precio minorista por kilo ($)</label>
            <input id="i-price" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="180" />
          </div>
          <div>
            <label htmlFor="i-wholesale" className={labelClass}>Precio mayorista por kilo ($, opcional)</label>
            <input id="i-wholesale" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.wholesalePrice} onChange={(e) => set('wholesalePrice', e.target.value)} placeholder="150" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="i-boxw" className={labelClass}>Peso por caja (kg, opcional)</label>
            <input id="i-boxw" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.boxWeight} onChange={(e) => set('boxWeight', e.target.value)} placeholder="10" />
          </div>
          <div>
            <label htmlFor="i-boxp" className={labelClass}>Precio por caja ($, opcional)</label>
            <input id="i-boxp" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.boxPrice} onChange={(e) => set('boxPrice', e.target.value)} placeholder="1700" disabled={form.boxWeight === ''} />
            <p className="text-xs text-[#515154] mt-1.5">Si lo dejás vacío, se calcula como precio por kilo × peso por caja.</p>
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Zona de entrega</legend>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_AREAS.map((a) => {
              const on = form.deliveryAreas.includes(a);
              return (
                <label
                  key={a}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm cursor-pointer border transition-colors ${
                    on ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]' : 'bg-white text-[#1D1D1F] border-[#000000]/10 hover:bg-[#F5F5F7]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => set('deliveryAreas', on ? form.deliveryAreas.filter((x) => x !== a) : DELIVERY_AREAS.filter((x) => x === a || form.deliveryAreas.includes(x)))}
                  />
                  {a}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="i-cat" className={labelClass}>Categoría</label>
          <select id="i-cat" className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.inStock} onChange={(e) => set('inStock', e.target.checked)} />
            <span>
              <span className="font-medium">{form.inStock ? 'En stock' : 'Sin stock'}</span>
              <span className="block text-xs text-[#515154] mt-0.5">Los artículos sin stock siguen en el sitio, marcados como no disponibles.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            <span>
              <span className="font-medium">Destacado</span>
              <span className="block text-xs text-[#515154] mt-0.5">Se muestra como diapositiva en el inicio del sitio (los 5 destacados más recientes).</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.onSale} onChange={(e) => set('onSale', e.target.checked)} />
            <span>
              <span className="font-medium">En oferta</span>
              <span className="block text-xs text-[#515154] mt-0.5">Muestra el precio de oferta junto al precio normal, que aparece tachado.</span>
            </span>
          </label>
          {form.onSale && (
            <div>
              <label htmlFor="i-sale" className={labelClass}>Precio de oferta por kilo ($)</label>
              <input id="i-sale" type="number" min={0} step="any" inputMode="decimal" className={inputClass} value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="140" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.back()} className="text-sm px-5 py-3 rounded-full hover:bg-[#F5F5F7]">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
        >
          {saving ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
