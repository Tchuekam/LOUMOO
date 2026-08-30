/**
 * LOUMOO PRODUCTS DATASET
 * Universal Commerce Catalog
 */
export const products = {
  hotels: [
    {
      id: 'hotel-1',
      title: 'Sawa Luxury Hotel',
      merchant: 'Bonanjo, Douala',
      price: 'XAF 65 000',
      priceNumeric: 65000,
      rating: 4.8,
      reviewsCount: 128,
      badge: 'POPULAR',
      badgeClass: 'badge-new',
      category: 'Hotels',
      imageAspect: '4/3'
    },
    {
      id: 'hotel-2',
      title: 'Résidence Akwa Palm',
      merchant: 'Akwa, Douala',
      price: 'XAF 38 500',
      priceNumeric: 38500,
      rating: 4.5,
      reviewsCount: 84,
      badge: null,
      category: 'Hotels',
      imageAspect: '4/3'
    },
    {
      id: 'hotel-3',
      title: 'Mont Fébé Lodge',
      merchant: 'Yaoundé',
      price: 'XAF 52 000',
      priceNumeric: 52000,
      rating: 4.6,
      reviewsCount: 96,
      badge: 'DEAL',
      badgeClass: 'badge-sale',
      category: 'Hotels',
      imageAspect: '4/3'
    },
    {
      id: 'hotel-4',
      title: 'Kribi Beach Rooms',
      merchant: 'Kribi',
      price: 'XAF 29 000',
      priceNumeric: 29000,
      rating: 4.3,
      reviewsCount: 62,
      badge: null,
      category: 'Hotels',
      imageAspect: '4/3'
    }
  ],
  electronics: [
    {
      id: 'elec-1',
      title: 'MacBook Air M2 13"',
      merchant: 'Orca Electronics',
      price: 'XAF 745 000',
      originalPrice: '829 000',
      priceNumeric: 745000,
      discount: '-10%',
      rating: 4.9,
      reviewsCount: 218,
      badge: 'HOT',
      badgeClass: 'badge-hot',
      category: 'Electronics',
      specs: {
        chip: 'Apple M2',
        memory: '8 GB',
        battery: '18 h',
        warranty: '12 months'
      },
      imageAspect: '4/3'
    },
    {
      id: 'elec-2',
      title: 'Sony WH-1000XM5',
      merchant: 'Digital Corner',
      price: 'XAF 189 000',
      priceNumeric: 189000,
      rating: 4.7,
      reviewsCount: 142,
      badge: 'NEW',
      badgeClass: 'badge-new',
      category: 'Electronics',
      imageAspect: '4/3'
    },
    {
      id: 'elec-3',
      title: 'Samsung A55 256GB',
      merchant: 'Mboppi Mobile',
      price: 'XAF 245 000',
      priceNumeric: 245000,
      rating: 4.4,
      reviewsCount: 98,
      badge: null,
      category: 'Electronics',
      imageAspect: '4/3'
    },
    {
      id: 'elec-4',
      title: 'Anker 737 Power Bank',
      merchant: 'Orca Electronics',
      price: 'XAF 62 000',
      priceNumeric: 62000,
      rating: 4.6,
      reviewsCount: 75,
      badge: null,
      category: 'Electronics',
      imageAspect: '4/3'
    }
  ],
  universities: [
    {
      id: 'edu-1',
      title: 'Institut Saint Jean',
      merchant: 'Admissions open',
      price: 'From XAF 450k',
      rating: null,
      status: '✓ Verified',
      category: 'Education'
    },
    {
      id: 'edu-2',
      title: 'ICT University',
      merchant: 'Yaoundé campus',
      price: 'From XAF 620k',
      rating: null,
      status: '✓ Verified',
      category: 'Education'
    },
    {
      id: 'edu-3',
      title: 'Ecole 241 Coding',
      merchant: '6-month bootcamp',
      price: 'From XAF 180k',
      rating: 4.8,
      category: 'Education'
    },
    {
      id: 'edu-4',
      title: 'Alliance Française',
      merchant: 'Language courses',
      price: 'From XAF 45k',
      rating: 4.5,
      category: 'Education'
    }
  ],
  services: [
    {
      id: 'srv-1',
      title: 'Event photography',
      merchant: 'Brice N. · Freelancer',
      price: 'XAF 80 000/day',
      rating: 5.0,
      category: 'Services'
    },
    {
      id: 'srv-2',
      title: 'Solar installation',
      merchant: 'Volt Services Sarl',
      price: 'Quote on request',
      status: '✓ Verified',
      category: 'Services'
    }
  ]
};
