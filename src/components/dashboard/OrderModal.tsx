'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCheck, Printer, X } from 'lucide-react';
import { updateLeadDetails, updateLeadStatus } from '@/src/services/dbService';
import type { Lead, LeadStatus } from '@/src/types/firestore';
import { formatMoney, whatsappUrl } from '@/src/utils/format';
import { inputClass, labelClass } from '@/src/components/dashboard/ui';

/** Order flow: Nuevo -> Aceptado (contacted) -> Confirmado (closed). */
export const orderStatusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Aceptado',
  closed: 'Confirmado',
};

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function OrderModal({
  lead,
  productTitle,
  agentName,
  onClose,
}: {
  lead: Lead;
  productTitle: string;
  agentName: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(lead.quantity !== undefined ? String(lead.quantity) : '');
  const [unitPrice, setUnitPrice] = useState(lead.unitPrice !== undefined ? String(lead.unitPrice) : '');
  const [message, setMessage] = useState(lead.message);
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const qtyNum = quantity.trim() === '' ? undefined : Number(quantity);
  const priceNum = unitPrice.trim() === '' ? undefined : Number(unitPrice);
  const total = qtyNum !== undefined && priceNum !== undefined ? qtyNum * priceNum : undefined;
  const dirty =
    message !== lead.message ||
    notes !== (lead.notes ?? '') ||
    qtyNum !== lead.quantity ||
    priceNum !== lead.unitPrice;

  const save = async (): Promise<boolean> => {
    if (qtyNum !== undefined && (!Number.isInteger(qtyNum) || qtyNum < 1)) {
      setFeedback({ ok: false, text: 'La cantidad debe ser un número entero de 1 o más.' });
      return false;
    }
    if (priceNum !== undefined && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setFeedback({ ok: false, text: 'El precio no es válido.' });
      return false;
    }
    try {
      await updateLeadDetails(lead.id, { quantity: qtyNum, unitPrice: priceNum, message, notes });
      return true;
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setFeedback({
        ok: false,
        text: denied
          ? 'Permiso denegado. Publicá las reglas de Firestore actualizadas (firestore.rules) para poder editar pedidos.'
          : 'No se pudieron guardar los cambios.',
      });
      return false;
    }
  };

  const run = async (action: () => Promise<boolean>, okText: string) => {
    setBusy(true);
    setFeedback(null);
    const ok = await action();
    setBusy(false);
    if (ok) setFeedback({ ok: true, text: okText });
  };

  const saveChanges = () => run(save, 'Cambios guardados.');

  const setStatus = (status: LeadStatus, okText: string) =>
    run(async () => {
      if (dirty && !(await save())) return false;
      try {
        await updateLeadStatus(lead.id, status);
        return true;
      } catch {
        setFeedback({ ok: false, text: 'No se pudo actualizar el estado.' });
        return false;
      }
    }, okText);

  const print = () => {
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) {
      setFeedback({ ok: false, text: 'El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes.' });
      return;
    }
    const rows = [
      ['Cliente', lead.clientName || 'Sin nombre'],
      ['Teléfono', lead.phone],
      ['Correo', lead.email],
      ['Fecha', lead.createdAt ? new Date(lead.createdAt).toLocaleString('es-UY') : ''],
      ['Estado', orderStatusLabels[lead.status]],
      ['Producto', productTitle],
      ['Cantidad', qtyNum !== undefined ? String(qtyNum) : ''],
      ['Precio unitario', priceNum !== undefined ? formatMoney(priceNum) : ''],
      ['Total', total !== undefined ? formatMoney(total) : ''],
    ].filter(([, v]) => v);
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pedido ${esc(lead.id.slice(0, 6).toUpperCase())}</title>
<style>
  body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:32px}
  h1{font-size:22px;margin:0}.sub{color:#555;margin:2px 0 20px}
  table{border-collapse:collapse;width:100%;margin-bottom:20px}
  td{padding:7px 0;border-bottom:1px solid #ddd;vertical-align:top}td:first-child{width:160px;color:#555}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:18px 0 6px}
  pre{white-space:pre-wrap;font:inherit;margin:0}
  .sign{margin-top:48px;display:flex;gap:40px}.sign div{flex:1;border-top:1px solid #111;padding-top:6px;color:#555;font-size:12px}
</style></head><body>
<h1>Merkado — Pedido ${esc(lead.id.slice(0, 6).toUpperCase())}</h1>
<p class="sub">Impreso por ${esc(agentName || 'Merkado')} · ${esc(new Date().toLocaleString('es-UY'))}</p>
<table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<h2>Detalle y entrega</h2><pre>${esc(message || '—')}</pre>
${notes.trim() ? `<h2>Notas internas</h2><pre>${esc(notes)}</pre>` : ''}
<div class="sign"><div>Preparó</div><div>Recibió</div></div>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`);
    w.document.close();
  };

  const wa = lead.phone
    ? whatsappUrl(
        lead.phone,
        `Hola${lead.clientName ? ` ${lead.clientName.split(' ')[0]}` : ''}, te escribimos de Merkado por tu pedido de ${productTitle || 'frutas y verduras'}.` +
          (lead.status === 'closed' ? ' Tu pedido está confirmado.' : '')
      )
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del pedido"
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white border-b border-[#000000]/5 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight truncate">{lead.clientName || 'Sin nombre'}</h2>
            <p className="text-xs text-[#515154]">
              Pedido {lead.id.slice(0, 6).toUpperCase()} · {lead.channel}
              {lead.createdAt ? ` · ${new Date(lead.createdAt).toLocaleString('es-UY')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                lead.status === 'new'
                  ? 'bg-[#1D1D1F] text-white'
                  : lead.status === 'contacted'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-green-50 text-green-700'
              }`}
            >
              {orderStatusLabels[lead.status]}
            </span>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <p><span className="text-[#515154]">Teléfono: </span>{lead.phone || '—'}</p>
            <p className="truncate"><span className="text-[#515154]">Correo: </span>{lead.email || '—'}</p>
            <p className="sm:col-span-2"><span className="text-[#515154]">Producto: </span><strong>{productTitle || '—'}</strong></p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="om-qty" className={labelClass}>Cantidad</label>
              <input id="om-qty" inputMode="numeric" className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label htmlFor="om-price" className={labelClass}>Precio unitario</label>
              <input id="om-price" inputMode="decimal" className={inputClass} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
            <div>
              <span className={labelClass}>Total</span>
              <p className="px-1 py-3 text-lg font-semibold">{total !== undefined ? formatMoney(total) : '—'}</p>
            </div>
          </div>

          <div>
            <label htmlFor="om-msg" className={labelClass}>Detalle del pedido, entrega e instrucciones</label>
            <textarea id="om-msg" rows={6} maxLength={5000} className={`${inputClass} resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div>
            <label htmlFor="om-notes" className={labelClass}>Notas internas</label>
            <textarea id="om-notes" rows={2} maxLength={2000} className={`${inputClass} resize-y`} placeholder="Solo las ves vos y tu equipo." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {feedback && (
            <p role={feedback.ok ? 'status' : 'alert'} className={`text-sm ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
              {feedback.text}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-white border-t border-[#000000]/5 px-6 py-4">
          <button type="button" disabled={busy || !dirty} onClick={saveChanges} className="rounded-full bg-[#F5F5F7] px-5 py-2.5 text-sm font-medium hover:bg-[#E5E5EA] disabled:opacity-40 transition-colors">
            Guardar cambios
          </button>
          <button type="button" disabled={busy || lead.status !== 'new'} onClick={() => setStatus('contacted', 'Pedido aceptado.')} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors">
            <Check className="w-4 h-4" /> Aceptar
          </button>
          <button type="button" disabled={busy || lead.status === 'closed'} onClick={() => setStatus('closed', 'Pedido confirmado.')} className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#333336] disabled:opacity-40 transition-colors">
            <CheckCheck className="w-4 h-4" /> Confirmar
          </button>
          <button type="button" onClick={print} className="inline-flex items-center gap-1.5 rounded-full border border-[#000000]/10 px-5 py-2.5 text-sm font-medium hover:bg-[#F5F5F7] transition-colors sm:ml-auto">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#000000]/10 px-5 py-2.5 text-sm font-medium hover:bg-[#F5F5F7] transition-colors">
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
