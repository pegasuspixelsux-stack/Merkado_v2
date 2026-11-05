import type { Metadata } from 'next';
import FavoritesPage from '@/src/components/FavoritesPage';

export const metadata: Metadata = {
  title: 'Mis favoritos | Merkado',
  description: 'Tu lista habitual de productos para pedir en un clic con los precios de hoy.',
};

export default function Page() {
  return <FavoritesPage />;
}
