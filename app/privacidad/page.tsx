import type { Metadata } from 'next';
import Link from 'next/link';
import { getBusinessSettings } from '@/src/services/businessService';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos personales recopilamos, para qué los usamos y cómo ejercer tus derechos.',
};

const UPDATED = 'noviembre de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#515154] font-light">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const b = await getBusinessSettings();
  const name = b.businessName || 'el operador de este sitio';
  const contact = b.email || b.whatsapp || b.phone;

  return (
    <main className="max-w-3xl mx-auto px-6 py-14 text-[#1D1D1F]">
      <Link href="/" className="text-sm text-[#515154] hover:text-[#1D1D1F]">← Volver al inicio</Link>
      <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">Política de privacidad</h1>
      <p className="mt-3 text-sm text-[#86868B]">Última actualización: {UPDATED}</p>

      <p className="mt-8 text-sm leading-relaxed text-[#515154] font-light">
        Este sitio es un canal de pedidos entre empresas (B2B). Esta política explica qué datos personales tratamos,
        para qué, con quién los compartimos y cómo podés ejercer tus derechos, de acuerdo con la Ley N.º 18.331 de
        Protección de Datos Personales de Uruguay y su normativa complementaria.
      </p>

      <Section title="1. Responsable">
        <p>
          El responsable del tratamiento es <strong className="font-medium text-[#1D1D1F]">{name}</strong>
          {b.rut ? ` (RUT ${b.rut})` : ''}
          {b.address ? `, con domicilio en ${b.address}` : ''}.
          {contact ? ' Podés escribirnos a ' : ''}
          {b.email ? <a className="underline underline-offset-2" href={`mailto:${b.email}`}>{b.email}</a> : b.whatsapp || b.phone}
          {contact ? ' para cualquier consulta sobre tus datos.' : ''}
        </p>
      </Section>

      <Section title="2. Qué datos recopilamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="font-medium text-[#1D1D1F]">Solicitud de acceso mayorista:</strong> nombre del negocio y de contacto, teléfono, correo, tipo de negocio, volumen estimado y el mensaje que nos dejes.</li>
          <li><strong className="font-medium text-[#1D1D1F]">Perfil de cliente</strong> (lo crea nuestro equipo): datos del negocio y del contacto, WhatsApp, correo, dirección y hora de recepción, forma de pago, nivel de precios, notas y pedidos especiales, y tu contraseña o PIN de acceso.</li>
          <li><strong className="font-medium text-[#1D1D1F]">Pedidos:</strong> productos, cantidades, precios, datos de entrega o retiro, instrucciones especiales y estado del pedido.</li>
          <li><strong className="font-medium text-[#1D1D1F]">Favoritos:</strong> la lista de productos que marcás como habituales. No guardamos precios en ella.</li>
          <li><strong className="font-medium text-[#1D1D1F]">Datos del dispositivo:</strong> para mantenerte conectado guardamos en tu navegador un identificador de sesión (almacenamiento local). No usamos cookies de publicidad ni herramientas de seguimiento.</li>
        </ul>
      </Section>

      <Section title="3. Para qué los usamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Evaluar tu solicitud, crear tu cuenta y darte acceso a tus precios.</li>
          <li>Recibir, preparar, confirmar y entregar tus pedidos, incluida la confirmación de precios ajustados antes del envío.</li>
          <li>Coordinar el cobro y la forma de pago acordada.</li>
          <li>Comunicarnos con vos por WhatsApp, teléfono o correo sobre tus pedidos.</li>
          <li>Mantener la seguridad del sitio y prevenir usos indebidos.</li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </Section>

      <Section title="4. Con quién los compartimos">
        <p>
          Solo con proveedores que nos prestan servicios necesarios para operar el sitio: Google (Firebase / Firestore)
          para almacenar los datos, Vercel para alojar el sitio y WhatsApp cuando vos o nuestro equipo inician una conversación.
          Estos proveedores pueden tratar datos fuera de Uruguay; lo hacen bajo sus propias medidas de seguridad y condiciones de servicio.
          También podemos comunicar datos cuando una norma o una autoridad competente lo exija.
        </p>
      </Section>

      <Section title="5. Cuánto tiempo los conservamos">
        <p>
          Conservamos los datos de tu perfil mientras seas cliente y los de pedidos durante el tiempo necesario para
          cumplir obligaciones comerciales, contables y tributarias. Después los eliminamos o los anonimizamos.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <p>
          Podés acceder a tus datos, rectificarlos, actualizarlos, incluirlos o pedir su supresión, y oponerte a su
          tratamiento, escribiéndonos
          {contact ? <> a {b.email || b.whatsapp || b.phone}</> : ''}. Respondemos dentro de los plazos legales. Si considerás que no
          atendimos tu pedido, podés presentar un reclamo ante la Unidad Reguladora y de Control de Datos Personales (URCDP).
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: acceso restringido por roles, reglas de seguridad en la
          base de datos y conexión cifrada. Tu contraseña y tu PIN son personales: no los compartas, y avisanos si
          creés que alguien más los conoce para que los restablezcamos.
        </p>
      </Section>

      <Section title="8. Fotos y contenidos de terceros">
        <p>
          Algunas fotos del catálogo provienen de Wikipedia y Wikimedia Commons con licencias libres.
          Podés ver las fuentes en la página de <Link className="underline underline-offset-2" href="/creditos">créditos de fotos</Link>.
        </p>
      </Section>

      <Section title="9. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Publicaremos la versión vigente en esta página, con su fecha de actualización.
        </p>
      </Section>
    </main>
  );
}
