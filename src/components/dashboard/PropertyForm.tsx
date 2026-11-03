'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ImageUpload from '../ImageUpload';
import PropertyImage from '../PropertyImage';
import type {
  Currency,
  Property,
  PropertyInput,
  PropertyOperation,
  PropertyPhoto,
  PropertyStatus,
  PropertyType,
} from '../../types/firestore';
import { operationLabels, statusLabels, typeLabels } from '../../utils/format';
import { cardClass, inputClass, labelClass } from './ui';

interface FormState {
  title: string;
  description: string;
  operation: PropertyOperation;
  type: PropertyType;
  status: PropertyStatus;
  price: string;
  currency: Currency;
  city: string;
  neighborhood: string;
  address: string;
  country: string;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  garages: string;
  featured: boolean;
  photos: PropertyPhoto[];
}

const emptyForm: FormState = {
  title: '',
  description: '',
  operation: 'sale',
  type: 'house',
  status: 'active',
  price: '',
  currency: 'USD',
  city: '',
  neighborhood: '',
  address: '',
  country: '',
  bedrooms: '',
  bathrooms: '',
  areaM2: '',
  garages: '',
  featured: false,
  photos: [],
};

const steps = ['Details', 'Location & specs', 'Photos'] as const;
const DRAFT_KEY = 'coastal:property-draft';

function fromProperty(p: Property): FormState {
  return {
    title: p.title,
    description: p.description,
    operation: p.operation,
    type: p.type,
    status: p.status,
    price: String(p.price),
    currency: p.currency,
    city: p.location.city,
    neighborhood: p.location.neighborhood ?? '',
    address: p.location.address ?? '',
    country: p.location.country,
    bedrooms: String(p.specs.bedrooms),
    bathrooms: String(p.specs.bathrooms),
    areaM2: String(p.specs.areaM2),
    garages: p.specs.parkingSpaces === undefined ? '' : String(p.specs.parkingSpaces),
    featured: p.featured ?? false,
    photos: p.photos,
  };
}

interface PropertyFormProps {
  /** Existing property when editing; omit to create a new one. */
  initial?: Property;
  submitLabel: string;
  onSubmit: (data: PropertyInput) => Promise<void>;
}

export default function PropertyForm({ initial, submitLabel, onSubmit }: PropertyFormProps) {
  const router = useRouter();
  const { agent } = useAuth();
  const [form, setForm] = useState<FormState>(initial ? fromProperty(initial) : emptyForm);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const loadedDraft = useRef(Boolean(initial)); // editing never uses the draft

  // Restore an unsaved draft (new listings only).
  useEffect(() => {
    if (loadedDraft.current) return;
    loadedDraft.current = true;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = { ...emptyForm, ...JSON.parse(raw) } as FormState;
        queueMicrotask(() => {
          setForm(draft);
          setDraftRestored(true);
        });
      }
    } catch {
      /* storage unavailable or corrupt: start empty */
    }
  }, []);

  // Auto-save the draft as you type (new listings only).
  useEffect(() => {
    if (initial || !loadedDraft.current) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* ignore */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [form, initial]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): { step: number; message: string } | null => {
    if (!form.title.trim()) return { step: 0, message: 'Add a title.' };
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0)
      return { step: 0, message: 'Enter a valid price.' };
    if (!form.city.trim()) return { step: 1, message: 'Add the city.' };
    if (!form.country.trim()) return { step: 1, message: 'Add the country.' };
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    const problem = validate();
    if (problem) {
      setStep(problem.step);
      setError(problem.message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        operation: form.operation,
        type: form.type,
        status: form.status,
        price: Number(form.price),
        currency: form.currency,
        location: {
          city: form.city.trim(),
          neighborhood: form.neighborhood.trim() || undefined,
          address: form.address.trim() || undefined,
          country: form.country.trim(),
        },
        specs: {
          bedrooms: Number(form.bedrooms) || 0,
          bathrooms: Number(form.bathrooms) || 0,
          areaM2: Number(form.areaM2) || 0,
          parkingSpaces: form.garages === '' ? undefined : Number(form.garages) || 0,
        },
        photos: form.photos,
        featured: form.featured,
        agentId: initial?.agentId ?? agent.id,
        // Public pages cannot read agent profiles, so the contact details live on the listing.
        agentName: initial ? initial.agentName : agent.name || undefined,
        agentPhone: initial ? initial.agentPhone : agent.phone || undefined,
      });
      if (!initial) window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'permission-denied'
          ? 'Permission denied. Check that the Firestore rules are published and that you own this listing.'
          : err instanceof Error
            ? err.message
            : 'Could not save the property.'
      );
      setSaving(false);
    }
  };

  const discardDraft = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setForm(emptyForm);
    setDraftRestored(false);
    setStep(0);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F5F5F7] px-5 py-3 text-sm">
          <span>We restored your unsaved draft.</span>
          <button type="button" onClick={discardDraft} className="text-xs underline underline-offset-2">
            Discard draft
          </button>
        </div>
      )}

      {/* Step tabs */}
      <div role="tablist" aria-label="Listing steps" className="flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={step === i}
            onClick={() => setStep(i)}
            className={`text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
              step === i ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]'
            }`}
          >
            <span className="opacity-60 mr-2">{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={`${cardClass} p-6 md:p-8`}>
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="p-title" className={labelClass}>Title</label>
              <input id="p-title" className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Oceanfront villa with private beach" />
            </div>
            <div>
              <label htmlFor="p-desc" className={labelClass}>Description</label>
              <textarea id="p-desc" rows={5} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Highlights, layout, views, what makes it special…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="p-op" className={labelClass}>Operation</label>
                <select id="p-op" className={inputClass} value={form.operation} onChange={(e) => set('operation', e.target.value as PropertyOperation)}>
                  {Object.entries(operationLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="p-type" className={labelClass}>Property type</label>
                <select id="p-type" className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value as PropertyType)}>
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="p-status" className={labelClass}>Status</label>
                <select id="p-status" className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as PropertyStatus)}>
                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span>
                <span className="font-medium">Feature on the homepage</span>
                <span className="block text-xs text-[#515154] mt-0.5">Shown as a slide in the hero (the 5 most recent featured listings).</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <label htmlFor="p-price" className={labelClass}>Price{form.operation === 'rent' ? ' (per month)' : ''}</label>
                <input id="p-price" type="number" min={0} step="any" className={inputClass} value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-cur" className={labelClass}>Currency</label>
                <select id="p-cur" className={inputClass} value={form.currency} onChange={(e) => set('currency', e.target.value as Currency)}>
                  <option value="USD">USD</option>
                  <option value="UYU">UYU</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="p-city" className={labelClass}>City</label>
                <input id="p-city" className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-hood" className={labelClass}>Neighborhood</label>
                <input id="p-hood" className={inputClass} value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-addr" className={labelClass}>Address (optional)</label>
                <input id="p-addr" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-country" className={labelClass}>Country</label>
                <input id="p-country" className={inputClass} value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <label htmlFor="p-beds" className={labelClass}>Bedrooms</label>
                <input id="p-beds" type="number" min={0} className={inputClass} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-baths" className={labelClass}>Bathrooms</label>
                <input id="p-baths" type="number" min={0} step={0.5} className={inputClass} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-area" className={labelClass}>Area (m²)</label>
                <input id="p-area" type="number" min={0} className={inputClass} value={form.areaM2} onChange={(e) => set('areaM2', e.target.value)} />
              </div>
              <div>
                <label htmlFor="p-garages" className={labelClass}>Garages</label>
                <input id="p-garages" type="number" min={0} className={inputClass} value={form.garages} onChange={(e) => set('garages', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <ImageUpload
              multiple
              onUploaded={({ url, fileId }) => setForm((f) => ({ ...f, photos: [...f.photos, { url, fileId }] }))}
              onError={setError}
            />
            {form.photos.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {form.photos.map((photo, i) => (
                  <li key={photo.url} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E5E5EA]">
                    <PropertyImage src={photo.url} alt={`Photo ${i + 1}`} variant="thumb" sizes="(min-width: 640px) 25vw, 50vw" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-white/90 text-black text-[10px] font-semibold px-2.5 py-1 rounded-full">Cover</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-[#515154]">The first photo is the cover image shown on cards.</p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          className="text-sm px-5 py-3 rounded-full hover:bg-[#F5F5F7]"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <div className="flex items-center gap-3">
          {step < steps.length - 1 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="text-sm font-medium px-6 py-3 rounded-full bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]"
            >
              Next
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
