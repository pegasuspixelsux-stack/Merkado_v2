'use client';

import DailyOrder from '@/src/components/dashboard/DailyOrder';
import { PageHeader } from '@/src/components/dashboard/ui';

export default function DailyOrderPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Pedido del día"
        description="Suma todos los pedidos de los clientes de una fecha, producto por producto, y arma la lista para comprar en el mercado."
      />
      <DailyOrder />
    </>
  );
}
