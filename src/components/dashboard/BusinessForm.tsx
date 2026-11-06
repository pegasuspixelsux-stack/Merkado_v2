'use client';

import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useBusiness } from '@/src/context/BusinessContext';
import { saveBusinessSettings } from '@/src/services/businessService';
import type { BusinessSettings } from '@/src/types/firestore';
import { cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';

/**
 * "Datos del negocio": the operator's name (title of the catalogue), address, contact, RUT / license and hours.
 * They appear in the site header and footer and on the printed sheets. Only administrators can change them.
 */
export default function BusinessForm() {
  const { agent } = useAuth();
  const current = useBusiness();
  const [form, setForm] = useState<BusinessSettings>(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const canEdit = agent?.role === 'admin';

  const set = <K extends keyof BusinessSettings>(key: K, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = (Object.keys(form) as (keyof BusinessSettings)[]).some((k) => form[k].trim() !== current[k]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setMessage({ ok: false, text: 'El correo no parece válido.' });
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveBusinessSettings(form);
      setMessage({ ok: true, text: 'Datos del negocio guardados. Ya se ven en el sitio.' });
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setMessage({
        ok: false,
        text: denied
          ? 'Permiso denegado. Solo un administrador puede cambiarlos, y hay que publicar las reglas de Firestore actualizadas.'
          : 'No se pudieron guardar los datos.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`${cardClass} p-6 md:p-8 max-w-xl space-y-5 mt-6`}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Datos del negocio</h2>
        <p className="text-xs text-[#515154] mt-1">
          Se muestran en el título del catálogo, en el pie del sitio y en las hojas impresas.
          {!canEdit && ' Solo un administrador puede cambiarlos.'}
        </p>
      </div>

      <div>
        <label htmlFor="b-name" className={labelClass}>Nombre del operador (título del catálogo)</label>
        <input id="b-name" className={inputClass} value={form.businessName} disabled={!canEdit} maxLength={120} onChange={(e) => set('businessName', e.target.value)} placeholder="Merkado para Mayoristas" />
        <p className="text-xs text-[#86868B] mt-1">Si lo dejás vacío se usa “Merkado para Mayoristas”.</p>
      </div>
      <div>
        <label htmlFor="b-address" className={labelClass}>Dirección</label>
        <input id="b-address" className={inputClass} value={form.address} disabled={!canEdit} maxLength={200} onChange={(e) => set('address', e.target.value)} placeholder="Calle y número, ciudad" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="b-email" className={labelClass}>Correo electrónico</label>
          <input id="b-email" type="email" className={inputClass} value={form.email} disabled={!canEdit} maxLength={200} onChange={(e) => set('email', e.target.value)} placeholder="contacto@tuempresa.com" />
        </div>
        <div>
          <label htmlFor="b-wa" className={labelClass}>WhatsApp</label>
          <input id="b-wa" type="tel" className={inputClass} value={form.whatsapp} disabled={!canEdit} maxLength={50} onChange={(e) => set('whatsapp', e.target.value)} placeholder="099 123 456" />
        </div>
        <div>
          <label htmlFor="b-phone" className={labelClass}>Teléfono</label>
          <input id="b-phone" type="tel" className={inputClass} value={form.phone} disabled={!canEdit} maxLength={50} onChange={(e) => set('phone', e.target.value)} placeholder="2xxx xxxx" />
        </div>
        <div>
          <label htmlFor="b-rut" className={labelClass}>RUT</label>
          <input id="b-rut" className={inputClass} value={form.rut} disabled={!canEdit} maxLength={60} onChange={(e) => set('rut', e.target.value)} placeholder="21 234567 0012" />
        </div>
      </div>
      <div>
        <label htmlFor="b-license" className={labelClass}>Habilitación / licencia</label>
        <input id="b-license" className={inputClass} value={form.license} disabled={!canEdit} maxLength={120} onChange={(e) => set('license', e.target.value)} placeholder="Nº de habilitación municipal o sanitaria" />
      </div>
      <div>
        <label htmlFor="b-hours" className={labelClass}>Horario de atención</label>
        <textarea id="b-hours" rows={3} className={`${inputClass} resize-none`} value={form.hours} disabled={!canEdit} maxLength={400} onChange={(e) => set('hours', e.target.value)} placeholder={'Lunes a sábado de 5:00 a 14:00\nDomingos cerrado'} />
      </div>

      <div>
        <p className={labelClass}>Redes sociales</p>
        <div className="space-y-3">
          <input aria-label="Instagram" className={inputClass} value={form.instagram} disabled={!canEdit} maxLength={200} onChange={(e) => set('instagram', e.target.value)} placeholder="Instagram: @tuempresa o el enlace" />
          <input aria-label="Facebook" className={inputClass} value={form.facebook} disabled={!canEdit} maxLength={200} onChange={(e) => set('facebook', e.target.value)} placeholder="Facebook: nombre de la página o el enlace" />
          <input aria-label="YouTube" className={inputClass} value={form.youtube} disabled={!canEdit} maxLength={200} onChange={(e) => set('youtube', e.target.value)} placeholder="YouTube: enlace del canal" />
        </div>
        <p className="text-xs text-[#86868B] mt-1.5">Salen como íconos en el menú del celular. El WhatsApp de arriba también aparece. Lo que dejes vacío no se muestra.</p>
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {canEdit && (
        <button
          type="submit"
          disabled={saving || !dirty}
          className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar datos del negocio'}
        </button>
      )}
    </form>
  );
}
