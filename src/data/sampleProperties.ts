import type { PropertyInput } from '../types/firestore';
import { USD_TO_UYU } from '../utils/format';

type Sample = Omit<PropertyInput, 'agentId'>;

function sample(
  title: string,
  category: string,
  weight: number,
  unit: string,
  price: number,
  imageId: string,
  description: string,
  extra: { inStock?: boolean; salePrice?: number } = {}
): Sample {
  return {
    title,
    description,
    type: category,
    weight,
    unit,
    // los precios de abajo están escritos en US$ y se convierten a pesos (US$ 1 = $ 40)
    price: price * USD_TO_UYU,
    // precio mayorista de muestra: 20% menos que el minorista
    wholesalePrice: Math.round(price * 0.8 * USD_TO_UYU),
    inStock: extra.inStock ?? true,
    ...(extra.salePrice !== undefined ? { salePrice: extra.salePrice * USD_TO_UYU } : {}),
    // Los campos de abajo no se usan para productos frescos; solo mantienen los datos válidos para las reglas de seguridad.
    operation: 'sale',
    currency: 'UYU',
    location: { city: '', country: '' },
    specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
    photos: [{ url: `https://images.unsplash.com/photo-${imageId}?q=80&w=1200&auto=format&fit=crop` }],
    deliveryAreas: ['Maldonado'],
    status: 'active',
  };
}

/** Los nueve artículos de muestra del sitio (el botón "Importar artículos de muestra" carga estos). */
export const sampleProperties: Sample[] = [
  sample('Tomates perita', 'vegetable', 12, 'lb', 4.5, '1592924357228-91a4daadcfea',
    'Tomates madurados al sol y cosechados al amanecer.'),
  sample('Sandía sin semillas', 'fruit', 18, 'lb', 6.9, '1587049352846-4a222e784d38',
    'Crocante, dulce y bien fría.', { salePrice: 5.5 }),
  sample('Mangos Ataulfo', 'tropical', 10, 'lb', 18, '1601493700631-2b16ec4b4716',
    'Pulpa cremosa y sin fibras, en plena temporada.', { inStock: false }),
  sample('Ananás dorados', 'tropical', 4, 'lb', 3.8, '1550258987-190a2d41a8ba',
    'Extra dulces y listos para comer.'),
  sample('Papas blancas', 'vegetable', 50, 'lb', 0.85, '1518977676601-b53f82aba655',
    'Papas para todo uso: al horno, asadas o fritas.'),
  sample('Mandarinas clementinas', 'fruit', 5, 'lb', 2.2, '1557800636-894a64c1696f',
    'Fáciles de pelar, sin semillas y jugosas.'),
  sample('Mix de verduras de huerta', 'vegetable', 20, 'lb', 32, '1597362925123-77861d3fbac7',
    'Una semana de verduras de estación en una sola caja.'),
  sample('Mix de frutos rojos y cítricos', 'fruit', 8, 'lb', 21, '1519996529931-28324d5a630e',
    'Frutos rojos y cítricos, lavados y listos.'),
  sample('Hojas verdes para ensalada', 'leafy', 10, 'lb', 3.2, '1540420773420-3366772f4999',
    'Mix de hojas baby, lavadas y embolsadas.', { salePrice: 2.8 }),
];
