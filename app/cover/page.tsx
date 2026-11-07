import type { Metadata } from 'next';
import CoverPage from '@/src/components/CoverPage';

export const metadata: Metadata = {
  title: 'Merkado | Distribuidor hortifrutícola para mayoristas',
  description: 'Distribuidor hortifrutícola para la gastronomía de Punta del Este. Accedé al catálogo mayorista o solicitá tu acceso.',
};

export default function Page() {
  return <CoverPage />;
}
