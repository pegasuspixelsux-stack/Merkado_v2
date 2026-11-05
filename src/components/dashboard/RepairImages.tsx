'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { getProperties, updateProperty } from '@/src/services/dbService';
import { imageFor } from '@/src/data/itemImages';
import { cardClass } from '@/src/components/dashboard/ui';
import type { Property } from '@/src/types/firestore';

const urlOf = (p: Property) => p.photos[0]?.url ?? '';

/** Loads the picture to know whether the link still works. */
const loads = (url: string) =>
  new Promise<boolean>((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    const timer = setTimeout(() => resolve(false), 15000);
    img.onload = () => (clearTimeout(timer), resolve(true));
    img.onerror = () => (clearTimeout(timer), resolve(false));
    img.src = url;
  });

/**
 * Admin tool: gives every product its own photo from src/data/itemImages.ts, replacing
 * missing, broken and repeated ones. Needs your signed-in session to write to Firestore.
 */
export default function RepairImages({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const all: Property[] = [];
      let cursor = null;
      do {
        const page = await getProperties({ pageSize: 100, cursor });
        all.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      // Photos used by more than one product with different names are repeats.
      const usedBy = new Map<string, Set<string>>();
      for (const p of all) usedBy.set(urlOf(p), (usedBy.get(urlOf(p)) ?? new Set()).add(p.title.trim().toLowerCase()));

      let changed = 0;
      let noPhotoFound = 0;
      for (const p of all) {
        const current = urlOf(p);
        const next = imageFor(p.title);
        if (!next) {
          if (!current || !(await loads(current))) noPhotoFound++;
          continue;
        }
        const repeated = (usedBy.get(current)?.size ?? 0) > 1;
        if (current === next || (!repeated && current && (await loads(current)))) continue;
        await updateProperty(p.id, { photos: [{ url: next }] });
        changed++;
      }
      setMsg({
        ok: true,
        text: `Listo: ${changed} producto(s) con foto nueva.` + (noPhotoFound ? ` ${noPhotoFound} sin foto disponible todavía.` : ''),
      });
      onDone();
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setMsg({ ok: false, text: denied ? 'Permiso denegado. Iniciá sesión como administrador.' : 'No se pudieron actualizar las fotos.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${cardClass} p-5 mb-6 flex flex-wrap items-center gap-4`}>
      <ImageIcon className="w-5 h-5 text-[#515154]" />
      <div className="flex-1 min-w-48">
        <p className="text-sm font-medium">Reparar fotos de productos</p>
        <p className="text-xs text-[#515154] font-light">
          Reemplaza las fotos que faltan, no cargan o se repiten entre productos distintos por fotos públicas nuevas.
        </p>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-full bg-[#1D1D1F] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#333336] disabled:opacity-50 transition-colors"
      >
        {busy ? 'Reparando…' : 'Reparar fotos'}
      </button>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`basis-full text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
