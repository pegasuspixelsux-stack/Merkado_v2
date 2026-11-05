'use client';

import { KeyRound } from 'lucide-react';

/** Event that WholesaleAccess listens to, so any page can open the client sign-in modal. */
export const OPEN_CLIENT_LOGIN = 'merkado:open-client-login';

/** Shown instead of the order form: Merkado is B2B, so only customers with a profile can order. */
export default function SignInNotice() {
  return (
    <div role="note" className="rounded-2xl bg-[#F5F5F7] px-5 py-4 text-sm space-y-3">
      <div className="space-y-1">
        <p className="font-medium">Para hacer un pedido ingresá como cliente.</p>
        <p className="text-[#515154] font-light">
          Los pedidos son solo para clientes con perfil. ¿Todavía no sos cliente? Solicitá el servicio desde “Mayoristas” en el inicio: tras la aprobación y la configuración del pago, Merkado te envía tu código.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_CLIENT_LOGIN))}
        className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white px-5 py-2.5 text-xs font-medium hover:bg-[#333336] transition-colors"
      >
        <KeyRound className="w-3.5 h-3.5" /> Ingresar como cliente
      </button>
    </div>
  );
}
