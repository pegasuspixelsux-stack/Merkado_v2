'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, Printer } from 'lucide-react';
import { useLeads } from '@/src/hooks/useLeads';
import { useCategories } from '@/src/hooks/useCategories';
import { getProperty } from '@/src/services/dbService';
import { useAuth } from '@/src/context/AuthContext';
import { useBusiness } from '@/src/context/BusinessContext';
import type { LeadStatus, PricingMode, Property } from '@/src/types/firestore';
import { pricingModeLabels, quantityLabel } from '@/src/utils/format';
import { dayKey, groupOrders, modeOfLine, orderDay, withoutPartialOrder } from '@/src/utils/orders';
import { cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';
import { orderStatusLabels } from '@/src/components/dashboard/OrderModal';

const LIMIT = 500;
const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;
const ALL_STATUSES: LeadStatus[] = ['new', 'contacted', 'closed'];

type SortBy = 'total' | 'name' | 'category';

interface Row {
  key: string;
  title: string;
  mode: PricingMode;
  qty: number;
  category: string;
  /** Who ordered it and how much, e.g. "Restaurante La Esquina (2)". */
  clients: { name: string; qty: number }[];
  property: Property | null;
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v: string | undefined, fallback: number) => {
  if (v === undefined || v.trim() === '') return fallback;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** What the quantity amounts to: "96 unidades · 48 kg" (empty when the item has no box data). */
function equivalence(row: Row, qty: number): string {
  const p = row.property;
  if (!p) return '';
  const parts: string[] = [];
  if (row.mode === 'por_caja') {
    if (p.boxUnits) parts.push(`${qty * p.boxUnits} ${p.pricingMode === 'por_atado' ? 'atados' : 'unidades'}`);
    if (p.boxWeight) parts.push(`${String(Math.round(qty * p.boxWeight * 100) / 100).replace('.', ',')} kg`);
  } else if (row.mode === 'por_unidad' && p.unitWeight) {
    parts.push(`${String(Math.round(qty * p.unitWeight * 100) / 100).replace('.', ',')} kg`);
  }
  return parts.join(' · ');
}

/**
 * "Pedido del día": every customer order for one day added up per item, ready to send to the market.
 * The operator can adjust the quantity to buy and add notes before printing or copying the list.
 */
export default function DailyOrder() {
  const { agent } = useAuth();
  const business = useBusiness();
  const { leads: loaded, loading, error } = useLeads(LIMIT);
  const { labelFor } = useCategories();
  const [date, setDate] = useState(() => dayKey(Date.now()));
  const [statuses, setStatuses] = useState<Set<LeadStatus>>(new Set(ALL_STATUSES));
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [buy, setBuy] = useState<Record<string, string>>({});
  const [marketNotes, setMarketNotes] = useState('');
  const [properties, setProperties] = useState<Record<string, Property | null>>({});
  const [copied, setCopied] = useState(false);

  // Adjustments are kept per day in this browser, so a reload does not lose them.
  const storageKey = `merkado-daily-order-${date}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load the saved adjustments for the chosen day
      setBuy(saved?.buy ?? {});
      setMarketNotes(saved?.notes ?? '');
    } catch {
      setBuy({});
      setMarketNotes('');
    }
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ buy, notes: marketNotes }));
    } catch {
      /* private mode: adjustments just are not kept */
    }
  }, [storageKey, buy, marketNotes]);

  // The orders of the chosen day and statuses. An order cut by the 500-record limit is left out.
  const orders = useMemo(
    () => groupOrders(withoutPartialOrder(loaded, LIMIT)).filter((o) => orderDay(o) === date && statuses.has(o.status)),
    [loaded, date, statuses],
  );

  const ids = useMemo(
    () => [...new Set(orders.flatMap((o) => o.lines.map((l) => l.propertyId)).filter((id) => FIRESTORE_ID.test(id)))],
    [orders],
  );
  useEffect(() => {
    const missing = ids.filter((id) => !(id in properties));
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map((id) => getProperty(id).then((p) => [id, p] as const).catch(() => [id, null] as const))).then(
      (entries) => !cancelled && setProperties((cur) => ({ ...cur, ...Object.fromEntries(entries) })),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const rows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const order of orders) {
      for (const line of order.lines) {
        const property = FIRESTORE_ID.test(line.propertyId) ? (properties[line.propertyId] ?? null) : null;
        const mode = modeOfLine(line.message, property?.pricingMode ?? 'por_kilo');
        const key = `${line.propertyId}|${mode}`;
        const qty = line.quantity ?? 1;
        const who = line.clientName || 'Sin nombre';
        let row = map.get(key);
        if (!row) {
          row = {
            key,
            title: property?.title || (FIRESTORE_ID.test(line.propertyId) ? 'Cargando…' : line.propertyId),
            mode,
            qty: 0,
            category: property ? labelFor(property.type) : '',
            clients: [],
            property,
          };
          map.set(key, row);
        }
        row.property = property;
        if (property) {
          row.title = property.title;
          row.category = labelFor(property.type);
        }
        row.qty += qty;
        const c = row.clients.find((x) => x.name === who);
        if (c) c.qty += qty;
        else row.clients.push({ name: who, qty });
      }
    }
    const list = [...map.values()];
    const byName = (a: Row, b: Row) => a.title.localeCompare(b.title, 'es');
    list.sort(
      sortBy === 'total'
        ? (a, b) => b.qty - a.qty || byName(a, b)
        : sortBy === 'category'
          ? (a, b) => a.category.localeCompare(b.category, 'es') || byName(a, b)
          : byName,
    );
    return list;
  }, [orders, properties, sortBy, labelFor]);

  const toBuy = (r: Row) => num(buy[r.key], r.qty);
  const clientCount = new Set(orders.map((o) => o.primary.clientId || o.primary.clientName)).size;
  const boxes = rows.filter((r) => r.mode === 'por_caja').reduce((s, r) => s + toBuy(r), 0);

  const toggleStatus = (s: LeadStatus) =>
    setStatuses((cur) => {
      const next = new Set(cur);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const prettyDate = new Date(`${date}T12:00:00`).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const asText = () =>
    [
      `Pedido al mercado — ${prettyDate}`,
      '',
      ...rows.map((r) => {
        const eq = equivalence(r, toBuy(r));
        return `• ${r.title} — ${quantityLabel(toBuy(r), r.mode)}${eq ? ` (${eq})` : ''}`;
      }),
      marketNotes.trim() ? `\nNotas: ${marketNotes.trim()}` : '',
    ]
      .filter((l, i, a) => l !== '' || a[i - 1] !== '')
      .join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const print = () => {
    const w = window.open('', '_blank', 'width=860,height=1000');
    if (!w) return;
    const body = rows
      .map(
        (r, i) =>
          `<tr><td class="r">${i + 1}</td><td>${esc(r.title)}${r.category ? `<br><small>${esc(r.category)}</small>` : ''}</td><td class="r"><b>${toBuy(r)}</b></td><td>${esc(pricingModeLabels[r.mode].replace('Por ', ''))}${toBuy(r) !== 1 && r.mode !== 'por_kilo' ? '' : ''}</td><td>${esc(equivalence(r, toBuy(r)))}</td><td class="chk"></td></tr>`,
      )
      .join('');
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pedido al mercado ${esc(date)}</title>
<style>
  *{box-sizing:border-box}body{font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:28px}
  .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:10px}
  h1{font-size:22px;margin:0}.sub{color:#555;text-transform:capitalize}
  table{border-collapse:collapse;width:100%;margin-top:14px}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #111;padding:6px}
  td{padding:7px 6px;border-bottom:1px solid #ddd;vertical-align:top}td small{color:#777}.r{text-align:right}th.r{text-align:right}
  .chk{width:34px}.chk:after{content:"";display:block;width:14px;height:14px;border:1.5px solid #111;margin:auto}
  .tot{margin-top:12px;font-weight:600}
  .notes{margin-top:16px;border:1px solid #999;padding:8px 10px;min-height:90px}.notes h2{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#555;margin:0 0 4px}
  .notes pre{white-space:pre-wrap;font:inherit;margin:0}
  .foot{margin-top:14px;color:#555;font-size:11px}
</style></head><body>
<div class="top"><div><h1>${esc(business.businessName || 'Merkado')} — Pedido al mercado</h1><div class="sub">${esc(prettyDate)}${business.rut ? ` · RUT ${esc(business.rut)}` : ''}</div></div>
<div style="text-align:right">Operador: <b>${esc(agent?.name || '—')}</b><br>${orders.length} pedidos · ${clientCount} clientes</div></div>
<table><thead><tr><th class="r">#</th><th>Producto</th><th class="r">Cantidad</th><th>Unidad</th><th>Equivale a</th><th>Ok</th></tr></thead><tbody>${body}</tbody></table>
<p class="tot">${rows.length} productos${boxes ? ` · ${boxes} cajas en total` : ''}</p>
<div class="notes"><h2>Notas para el mercado</h2><pre>${esc(marketNotes.trim() || ' ')}</pre></div>
<p class="foot">Los precios de mercado valen para el día: confirmar precios con el proveedor antes de cerrar la compra.</p>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`);
    w.document.close();
  };

  return (
    <>
      <div className={`${cardClass} p-5 mb-6 grid gap-4 md:grid-cols-[auto_1fr_auto] items-end`}>
        <div>
          <label htmlFor="do-date" className={labelClass}>Fecha</label>
          <input id="do-date" type="date" className={inputClass} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <fieldset>
          <legend className={labelClass}>Pedidos a incluir</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <label key={s} className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition-colors ${statuses.has(s) ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]' : 'bg-white border-[#000000]/10 hover:bg-[#F5F5F7]'}`}>
                <input type="checkbox" className="sr-only" checked={statuses.has(s)} onChange={() => toggleStatus(s)} />
                {orderStatusLabels[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="do-sort" className={labelClass}>Ordenar por</label>
          <select id="do-sort" className={inputClass} value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="total">Total (mayor a menor)</option>
            <option value="name">Nombre</option>
            <option value="category">Categoría</option>
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm text-[#515154]">Cargando pedidos…</p>
      ) : rows.length === 0 ? (
        <div className={`${cardClass} p-8 text-center text-sm text-[#515154]`}>
          No hay pedidos para {prettyDate} con los estados elegidos.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-[#515154]">
              <span className="font-semibold text-[#1D1D1F]">{rows.length} productos</span> · {orders.length} pedidos · {clientCount} clientes
              {boxes > 0 && <> · <span className="font-semibold text-[#1D1D1F]">{boxes} cajas</span></>}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-[#000000]/10 px-4 py-2.5 text-xs font-medium hover:bg-[#F5F5F7] transition-colors">
                <ClipboardCopy className="w-3.5 h-3.5" /> {copied ? 'Copiado' : 'Copiar para WhatsApp'}
              </button>
              <button type="button" onClick={print} className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] text-white px-5 py-2.5 text-xs font-medium hover:bg-[#333336] transition-colors">
                <Printer className="w-3.5 h-3.5" /> Imprimir pedido al mercado
              </button>
            </div>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[#515154] border-b border-[#000000]/5">
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-3 py-3 font-semibold text-right">Pedido</th>
                  <th className="px-3 py-3 font-semibold text-right">A comprar</th>
                  <th className="px-5 py-3 font-semibold">Equivale a</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#000000]/5">
                {rows.map((r) => (
                  <tr key={r.key} className="align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-[#515154]">{[r.category, pricingModeLabels[r.mode].replace('Por ', '')].filter(Boolean).join(' · ')}</p>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        {r.clients.map((c) => `${c.name} (${c.qty})`).join(', ')}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold">{r.qty}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        aria-label={`Cantidad a comprar de ${r.title}`}
                        inputMode="decimal"
                        className={`${inputClass} !w-24 !px-3 !py-2 text-right ${toBuy(r) !== r.qty ? 'border-amber-400' : ''}`}
                        value={buy[r.key] ?? String(r.qty)}
                        onChange={(e) => setBuy((cur) => ({ ...cur, [r.key]: e.target.value }))}
                      />
                    </td>
                    <td className="px-5 py-3 text-[#515154] whitespace-nowrap">{equivalence(r, toBuy(r)) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <label htmlFor="do-notes" className={labelClass}>Notas para el mercado</label>
            <textarea id="do-notes" rows={3} className={`${inputClass} resize-y`} value={marketNotes} onChange={(e) => setMarketNotes(e.target.value)} placeholder="Ej.: tomates bien firmes, entregar antes de las 7, confirmar precio de la palta…" />
            <p className="text-xs text-[#86868B] mt-1.5">Los cambios en “A comprar” y estas notas se guardan en este navegador por fecha. Los precios de mercado valen para el día: confirmá precios con el proveedor.</p>
          </div>
        </>
      )}
    </>
  );
}
