export const PRODUCT = {
  id: 'aura-original',
  name: 'AURA — The Original',
  tagline: 'Pure form. Refined flow.',
  description:
    'A single, hand-finished vessel in borosilicate glass, closed with a knurled aluminum cap. AURA is designed to disappear into daily ritual — an object built to be used, not displayed.',
  image: '/assets/aura-bottle.jpg',
  sizes: [
    { id: '500', label: '500ml', sub: 'Everyday', price: 68 },
    { id: '750', label: '750ml', sub: 'Studio', price: 78 },
    { id: '1000', label: '1L', sub: 'Reserve', price: 92 },
  ],
  finishes: [
    { id: 'onyx', label: 'Onyx', hex: '#1c1c1e', filter: 'none' },
    { id: 'champagne', label: 'Champagne', hex: '#c9a876', filter: 'sepia(0.55) saturate(2.1) hue-rotate(-8deg) brightness(1.08)' },
    { id: 'graphite', label: 'Graphite', hex: '#6b6b70', filter: 'grayscale(0.6) brightness(1.15)' },
  ],
};

export function findSize(id) {
  return PRODUCT.sizes.find((s) => s.id === id) || PRODUCT.sizes[0];
}

export function findFinish(id) {
  return PRODUCT.finishes.find((f) => f.id === id) || PRODUCT.finishes[0];
}
