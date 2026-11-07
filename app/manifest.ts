import type { MetadataRoute } from 'next';

// Lets browsers install the site as an app / desktop shortcut with the Merkado icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Merkado para Mayoristas',
    short_name: 'Merkado',
    description: 'Distribuidor hortifrutícola para la gastronomía de Punta del Este.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBFBFD',
    theme_color: '#2E7D32',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
