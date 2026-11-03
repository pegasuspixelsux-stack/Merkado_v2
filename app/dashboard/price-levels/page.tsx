'use client';

import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useCategories } from '@/src/hooks/useCategories';
import { usePriceLevels } from '@/src/hooks/usePricing';
import { useProperties } from '@/src/hooks/useProperties';
import { savePriceLevel } from '@/src/services/pricingService';
import type { Category, PriceLevel } from '@/src/types/firestore';
import { PageHeader, cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';
import { calculateClientItemPrice } from '@/src/utils/pricing';
import { formatMoney } from '@/src/utils/format';

type Sign = '-' | '+';
interface Row {
  sign: Sign;
  pct: string;
}
interface Draft {
  name: string;
  description: string;
  rows: Record<string, Row>;
}

const SAMPLE_PRICE = 10;
const MAX_DISCOUNT = 100;
const MAX_MARKUP = 500;

const parsePct = (s: string) => Number(s.trim().replace(',', '.'));

function draftOf(level: PriceLevel, categories: Category[]): Draft {
  const rows: Record<string, Row> = {};
  for (const c of categories) {
    const v = level.categoryAdjustments[c.id] ?? 0;
    rows[c.id] = { sign: v < 0 ? '-' : '+', pct: v ? String(Math.abs(v)) : '' };
  }
  return { name: level.name, description: level.description, rows };
}

/** The signed percentage of a row, or an error text. Blank = no adjustment. */
function rowValue(row: Row): { value: number } | { error: string } {
  if (row.pct.trim() === '') return { value: 0 };
  const n = parsePct(row.pct);
  if (!Number.isFinite(n) || n < 0) return { error: 'Ingresá un porcentaje válido.' };
  if (row.sign === '-' && n > MAX_DISCOUNT) return { error: `Un descuento no puede superar ${MAX_DISCOUNT}%.` };
  if (row.sign === '+' && n > MAX_MARKUP) return { error: `Un recargo no puede superar ${MAX_MARKUP}%.` };
  return { value: row.sign === '-' ? -n : n };
}

export default function PriceLevelsPage() {
  const { agent } = useAuth();
  const { levels, loading, error } = usePriceLevels();
  const { categories } = useCategories();
  const { items } = useProperties(100);
  const [tab, setTab] = useState('level_1');
  // Unsaved edits per level; a level without a draft shows what is stored (and follows live changes).
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [bulk, setBulk] = useState<Row>({ sign: '-', pct: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const level = levels.find((l) => l.id === tab);
  const draft: Draft | null = useMemo(
    () => (level ? (drafts[tab] ?? draftOf(level, categories)) : null),
    [drafts, tab, level, categories],
  );

  if (agent && agent.role !== 'admin') {
    return (
      <>
        <PageHeader eyebrow="Precios" title="Niveles de precio" />
        <p className="text-sm text-[#515154]">Solo los administradores pueden ver y editar los niveles de precio.</p>
      </>
    );
  }

  const update = (changes: Partial<Draft>) => {
    if (!draft) return;
    setMessage(null);
    setDrafts((d) => ({ ...d, [tab]: { ...draft, ...changes } }));
  };
  const setRow = (id: string, changes: Partial<Row>) =>
    update({ rows: { ...draft!.rows, [id]: { ...draft!.rows[id], ...changes } } });

  const applyToAll = () => {
    const check = rowValue(bulk);
    if ('error' in check || bulk.pct.trim() === '') return setMessage({ ok: false, text: 'error' in check ? check.error : 'Ingresá un porcentaje.' });
    update({ rows: Object.fromEntries(categories.map((c) => [c.id, { ...bulk }])) });
  };
  const clearAll = () => update({ rows: Object.fromEntries(categories.map((c) => [c.id, { sign: '+' as Sign, pct: '' }])) });

  const save = async () => {
    if (!level || !draft) return;
    if (!draft.name.trim()) return setMessage({ ok: false, text: 'Ingresá un nombre para el nivel.' });
    const adjustments: Record<string, number> = {};
    for (const c of categories) {
      const r = draft.rows[c.id];
      if (!r) continue;
      const v = rowValue(r);
      if ('error' in v) return setMessage({ ok: false, text: `${c.name}: ${v.error}` });
      if (v.value !== 0) adjustments[c.id] = v.value;
    }
    setSaving(true);
    setMessage(null);
    try {
      const affected = await savePriceLevel({
        id: level.id,
        name: draft.name,
        description: draft.description,
        categoryAdjustments: adjustments,
      });
      setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== level.id)));
      setMessage({
        ok: true,
        text: `Nivel guardado. ${affected} ${affected === 1 ? 'cliente ya ve' : 'clientes ya ven'} los precios nuevos.`,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      setMessage({
        ok: false,
        text:
          code === 'permission-denied'
            ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas y que seas administrador.'
            : 'No se pudo guardar el nivel.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Precios"
        title="Niveles de precio"
        description="Cada cliente mayorista tiene un nivel. Su precio es el precio de lista del artículo más o menos un porcentaje según la categoría."
      />

      {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

      <div role="tablist" aria-label="Niveles" className="flex flex-wrap gap-2 mb-6">
        {levels.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={tab === l.id}
            onClick={() => {
              setTab(l.id);
              setMessage(null);
            }}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              tab === l.id ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#000000]/5 text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            Nivel {i + 1}
            {drafts[l.id] ? ' •' : ''}
          </button>
        ))}
      </div>

      {loading || !draft ? (
        <p className="text-sm text-[#515154]">Cargando…</p>
      ) : (
        <div className={`${cardClass} p-6 md:p-8 space-y-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="pl-name" className={labelClass}>Nombre del nivel</label>
              <input id="pl-name" className={inputClass} value={draft.name} maxLength={100} onChange={(e) => update({ name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="pl-notes" className={labelClass}>Notas</label>
              <input id="pl-notes" className={inputClass} value={draft.description} maxLength={1000} onChange={(e) => update({ description: e.target.value })} placeholder="ej. restaurantes con compra semanal" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label htmlFor="bulk-type" className={labelClass}>Aplicar a todas las categorías</label>
                <div className="flex gap-2">
                  <select id="bulk-type" className={`${inputClass} w-auto`} value={bulk.sign} onChange={(e) => setBulk({ ...bulk, sign: e.target.value as Sign })}>
                    <option value="-">Descuento (−)</option>
                    <option value="+">Recargo (+)</option>
                  </select>
                  <input aria-label="Porcentaje para todas" inputMode="decimal" className={`${inputClass} w-24`} value={bulk.pct} onChange={(e) => setBulk({ ...bulk, pct: e.target.value })} placeholder="10" />
                </div>
              </div>
              <button type="button" onClick={applyToAll} className="bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336]">
                Aplicar
              </button>
              <button type="button" onClick={clearAll} className="text-xs font-medium px-4 py-3 rounded-full hover:bg-[#F5F5F7]">
                Quitar todos los ajustes
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[#515154]">
                    <th className="py-2 pr-4 font-semibold">Categoría</th>
                    <th className="py-2 pr-4 font-semibold">Tipo</th>
                    <th className="py-2 pr-4 font-semibold">Porcentaje %</th>
                    <th className="py-2 font-semibold">Ejemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#000000]/5">
                  {categories.map((c) => {
                    const row = draft.rows[c.id] ?? { sign: '+' as Sign, pct: '' };
                    const v = rowValue(row);
                    const sampleItem = items.find((p) => p.type === c.id);
                    const base = sampleItem?.price ?? SAMPLE_PRICE;
                    const adjusted =
                      'value' in v ? calculateClientItemPrice({ listPrice: base, categoryId: c.id }, { categoryAdjustments: { [c.id]: v.value } }) : null;
                    return (
                      <tr key={c.id}>
                        <td className="py-3 pr-4 font-medium">{c.name}</td>
                        <td className="py-3 pr-4">
                          <select aria-label={`Tipo de ajuste para ${c.name}`} className={`${inputClass} w-auto`} value={row.sign} onChange={(e) => setRow(c.id, { sign: e.target.value as Sign })}>
                            <option value="-">Descuento (−)</option>
                            <option value="+">Recargo (+)</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <input aria-label={`Porcentaje para ${c.name}`} inputMode="decimal" className={`${inputClass} w-24`} value={row.pct} onChange={(e) => setRow(c.id, { pct: e.target.value })} placeholder="0" />
                        </td>
                        <td className="py-3 text-[#515154]">
                          {adjusted === null ? (
                            <span className="text-red-600 text-xs">{(v as { error: string }).error}</span>
                          ) : (
                            <>
                              {sampleItem ? `${sampleItem.title}: ` : ''}
                              {formatMoney(base, 'USD')} → <span className="font-semibold text-[#1D1D1F]">{formatMoney(adjusted, 'USD')}</span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#86868B] mt-3">
              Sin porcentaje = precio de lista. Si un artículo está en oferta por menos que el precio del nivel, el cliente paga el precio de oferta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar nivel de precio'}
            </button>
            {message && (
              <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
