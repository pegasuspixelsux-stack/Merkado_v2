import type { PropertyInput } from '../types/firestore';

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
    price,
    // sample mayorista price: 20% below the minorista price
    wholesalePrice: Math.round(price * 0.8 * 100) / 100,
    inStock: extra.inStock ?? true,
    ...(extra.salePrice !== undefined ? { salePrice: extra.salePrice } : {}),
    // The fields below are not used for produce; they only keep the data valid for the security rules.
    operation: 'sale',
    currency: 'USD',
    location: { city: '', country: '' },
    specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
    photos: [{ url: `https://images.unsplash.com/photo-${imageId}?q=80&w=1200&auto=format&fit=crop` }],
    status: 'active',
  };
}

/** The nine produce items from the website mockup (the "Import sample items" button loads these). */
export const sampleProperties: Sample[] = [
  sample('Vine Tomatoes', 'vegetable', 12, 'lb', 4.5, '1592924357228-91a4daadcfea',
    'Sun-ripened tomatoes picked at dawn.'),
  sample('Seedless Watermelon', 'fruit', 18, 'lb', 6.9, '1587049352846-4a222e784d38',
    'Crisp, sweet and chilled to order.', { salePrice: 5.5 }),
  sample('Ataulfo Mangoes', 'tropical', 10, 'lb', 18, '1601493700631-2b16ec4b4716',
    'Buttery flesh, no fibers, peak season.', { inStock: false }),
  sample('Gold Pineapples', 'tropical', 4, 'lb', 3.8, '1550258987-190a2d41a8ba',
    'Extra sweet and ready to eat.'),
  sample('Russet Potatoes', 'vegetable', 50, 'lb', 0.85, '1518977676601-b53f82aba655',
    'All-purpose potatoes for baking, roasting and frying.'),
  sample('Clementine Tangerines', 'fruit', 5, 'lb', 2.2, '1557800636-894a64c1696f',
    'Easy-peel, seedless and juicy.'),
  sample('Garden Vegetable Mix', 'vegetable', 20, 'lb', 32, '1597362925123-77861d3fbac7',
    'A week of seasonal vegetables in one box.'),
  sample('Berry & Citrus Mix', 'fruit', 8, 'lb', 21, '1519996529931-28324d5a630e',
    'Berries and citrus, washed and ready.'),
  sample('Salad Greens', 'leafy', 10, 'lb', 3.2, '1540420773420-3366772f4999',
    'Mixed baby greens, washed and bagged.', { salePrice: 2.8 }),
];
