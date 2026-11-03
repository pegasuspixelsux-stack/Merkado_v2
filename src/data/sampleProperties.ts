import type { PropertyInput } from '../types/firestore';

type Sample = Omit<PropertyInput, 'agentId'>;

const US = 'United States';
const sqftToM2 = (sqft: number) => Math.round(sqft * 0.092903);

function sample(
  title: string,
  city: string,
  price: number,
  bedrooms: number,
  bathrooms: number,
  sqft: number,
  imageId: string,
  description: string
): Sample {
  return {
    title,
    description,
    type: 'house',
    operation: 'sale',
    price,
    currency: 'USD',
    location: { city, state: 'CA', country: US },
    specs: { bedrooms, bathrooms, areaM2: sqftToM2(sqft) },
    photos: [
      { url: `https://images.unsplash.com/photo-${imageId}?q=80&w=1200&auto=format&fit=crop` },
    ],
    status: 'active',
  };
}

/** The nine properties from the website mockup. */
export const sampleProperties: Sample[] = [
  sample('The Horizon Villa', 'Big Sur', 14_500_000, 5, 6, 6200, '1600585154340-be6161a56a0c',
    'Absolute privacy meets endless Pacific views.'),
  sample('Cliffside Sanctuary', 'Malibu', 9_800_000, 4, 4.5, 4500, '1600607687939-ce8a6c25118c',
    'Suspended between sky and sea.'),
  sample('The Glass Pavilion', 'Carmel-by-the-Sea', 11_200_000, 3, 3.5, 3900, '1600566753376-12c8ab7fb75b',
    'Seamless architectural integration with nature.'),
  sample('Ocean Blue Estate', 'Laguna Beach', 18_500_000, 6, 7, 8100, '1613490493576-7fde63acd811',
    'Timeless luxury on the water’s edge.'),
  sample('The Dune House', 'Monterey', 7_400_000, 3, 3, 3200, '1512917774080-9991f1c4c750',
    'Minimalist living shaped by coastal winds.'),
  sample('Pacific Horizon', 'Pebble Beach', 12_900_000, 4, 5, 5100, '1600596542815-ffad4c1539a9',
    'Golf-course estate with sweeping ocean views.'),
  sample('Redwood Terrace', 'Mendocino', 6_900_000, 4, 4, 4100, '1600585154526-990dced4db0d',
    'Quiet retreat among the redwoods, minutes from the shoreline.'),
  sample('Tidewater House', 'Santa Barbara', 10_600_000, 5, 5.5, 5400, '1600047509807-ba8f99d2cdde',
    'Light-filled coastal living with room to entertain.'),
  sample('Driftwood Retreat', 'La Jolla', 13_400_000, 5, 6, 5800, '1600573472550-8090b5e0745e',
    'Ocean-view residence above the cove.'),
];
