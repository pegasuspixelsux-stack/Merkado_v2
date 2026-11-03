'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { readSheet } from 'read-excel-file/browser';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { importItems } from '../../services/dbService';
import { parseItemRows, type ParsedImport } from '../../utils/importItems';
import { cardClass } from './ui';

export default function ImportItems({ onImported }: { onImported: () => void }) {
  const { agent } = useAuth();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = () => {
    setFileName('');
    setParsed(null);
    setMessage(null);
  };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    setReading(true);
    try {
      const data = (await readSheet(file)) as unknown[][];
      setParsed(parseItemRows(data, categories));
    } catch {
      setMessage({ ok: false, text: 'No se pudo leer ese archivo. Usá un archivo Excel .xlsx (mirá el de muestra).' });
    } finally {
      setReading(false);
    }
  };

  const runImport = async () => {
    if (!agent || !parsed || parsed.items.length === 0) return;
    setImporting(true);
    setMessage(null);
    try {
      const count = await importItems(parsed.items, parsed.newCategories, agent);
      setMessage({ ok: true, text: `Se importaron ${count} ${count === 1 ? 'artículo' : 'artículos'}.` });
      setParsed(null);
      setFileName('');
      onImported();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setMessage({
        ok: false,
        text:
          code === 'permission-denied'
            ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas.'
            : 'La importación falló. No se guardó nada del lote que falló; probá de nuevo.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 bg-white border border-[#000000]/5 text-xs font-medium px-5 py-3 rounded-full hover:bg-[#F5F5F7] transition-all"
      >
        <FileSpreadsheet className="w-4 h-4" /> Importar Excel
      </button>

      {open && (
        <div className={`${cardClass} p-6 mt-3 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Importar artículos desde Excel</h2>
              <p className="text-xs text-[#515154] mt-1">
                Columnas: Título, Descripción, Peso, Unidad, Precio minorista, Categoría, En stock, Precio de oferta, Precio mayorista, URL de imagen.
              </p>
            </div>
            <a
              href="/merkado-items-sample.xlsx"
              download
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED]"
            >
              <Download className="w-4 h-4" /> Descargar archivo de muestra
            </a>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-dashed border-[#000000]/20 px-5 py-4 text-sm cursor-pointer hover:bg-[#F5F5F7]">
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">{fileName || 'Elegí un archivo .xlsx'}</span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>

          {reading && <p className="text-sm text-[#515154]">Leyendo el archivo…</p>}

          {parsed && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">{parsed.items.length}</span> {parsed.items.length === 1 ? 'artículo listo' : 'artículos listos'} para importar
                {parsed.errors.length > 0 && (
                  <>
                    , <span className="font-semibold text-red-600">{parsed.errors.length}</span> {parsed.errors.length === 1 ? 'fila con problemas (omitida)' : 'filas con problemas (omitidas)'}
                  </>
                )}
                .
              </p>
              {parsed.newCategories.length > 0 && (
                <p className="text-[#515154]">
                  Categorías nuevas a crear: {parsed.newCategories.map((c) => c.name).join(', ')}.
                </p>
              )}
              {parsed.errors.length > 0 && (
                <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-auto">
                  {parsed.errors.slice(0, 15).map((e, i) => (
                    <li key={i}>Fila {e.row}: {e.message}</li>
                  ))}
                  {parsed.errors.length > 15 && <li>…y {parsed.errors.length - 15} más.</li>}
                </ul>
              )}
              {parsed.items.some((i) => i.photos.length === 0) && (
                <p className="text-xs text-[#515154]">
                  Los artículos sin URL de imagen se importan sin foto. Editalos después para subir una.
                </p>
              )}
              <button
                type="button"
                onClick={runImport}
                disabled={importing || parsed.items.length === 0}
                className="bg-[#1D1D1F] text-white text-xs font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
              >
                {importing ? 'Importando…' : `Importar ${parsed.items.length} ${parsed.items.length === 1 ? 'artículo' : 'artículos'}`}
              </button>
            </div>
          )}

          {message && (
            <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
