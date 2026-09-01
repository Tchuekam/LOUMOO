/**
 * LOUMOO HIERARCHICAL COMMERCE TAXONOMY & CATEGORIES DATASET
 * Aligned 1:1 with authoritative backend BASELINE_TAXONOMY in ListingTaxonomyUseCase.js
 */

export const commerceDomains = [
  { id: 'all', name: 'All Ecosystem', icon: 'grid', description: 'Explore all commerce verticals across Cameroon' },
  { id: 'shop', name: 'Shop & Retail', icon: 'shopping-bag', description: 'Tech, luxury fashion, home goods, vehicles & authentic products' },
  { id: 'services', name: 'Services & Skills', icon: 'wrench', description: 'Certified repairs, consulting, education & creative experts' },
  { id: 'travel', name: 'Travel & Mobility', icon: 'plane', description: '5-star hotels, intercity VIP buses, flights & passenger trains' },
  { id: 'business', name: 'Business & Finance', icon: 'building-2', description: 'Titled real estate, commercial banking & digital software' }
];

export const categories = [
  // ── SHOP DOMAIN ──
  {
    id: 'electronics',
    domain: 'shop',
    vertical: 'electronics',
    name: 'Electronics & Technology',
    slug: 'electronics',
    icon: 'laptop',
    count: 410,
    storeCount: 48,
    description: 'Smartphones, laptops, studio audio, gaming & smart power backed by official warranties.',
    subCategories: [
      { id: 'smartphones', name: 'Smartphones & Mobile', icon: 'smartphone', count: 142 },
      { id: 'laptops', name: 'Laptops & Computers', icon: 'laptop', count: 84 },
      { id: 'audio', name: 'Audio & Studio ANC', icon: 'headphones', count: 96 },
      { id: 'power_accessories', name: 'Power & GaN Chargers', icon: 'zap', count: 88 }
    ]
  },
  {
    id: 'fashion',
    domain: 'shop',
    vertical: 'fashion',
    name: 'Fashion & Luxury',
    slug: 'fashion',
    icon: 'shirt',
    count: 320,
    storeCount: 36,
    description: 'Designer footwear, authentic streetwear, bespoke tailoring, watches & fine accessories.',
    subCategories: [
      { id: 'footwear', name: 'Footwear & Sneakers', icon: 'footprints', count: 185 },
      { id: 'clothing', name: 'Apparel & Streetwear', icon: 'tag', count: 95 },
      { id: 'watches_jewelry', name: 'Watches & Jewelry', icon: 'watch', count: 40 }
    ]
  },
  {
    id: 'home',
    domain: 'shop',
    vertical: 'home',
    name: 'Home & Living',
    slug: 'home',
    icon: 'home',
    count: 175,
    storeCount: 22,
    description: 'Modern furniture, smart kitchen appliances, luxury bedding & interior decor.',
    subCategories: [
      { id: 'furniture', name: 'Living & Office Furniture', icon: 'armchair', count: 85 },
      { id: 'appliances', name: 'Kitchen & Appliances', icon: 'refrigerator', count: 90 }
    ]
  },
  {
    id: 'automotive',
    domain: 'shop',
    vertical: 'automotive',
    name: 'Vehicles & Automotive',
    slug: 'automotive',
    icon: 'car',
    count: 115,
    storeCount: 18,
    description: 'Certified cars, commercial vehicles, motorbikes, replacement parts & diagnostic tools.',
    subCategories: [
      { id: 'cars', name: 'Cars & Light Vehicles', icon: 'car', count: 75 },
      { id: 'auto_parts', name: 'Spare Parts & Tires', icon: 'disc', count: 40 }
    ]
  },

  // ── SERVICES DOMAIN ──
  {
    id: 'services',
    domain: 'services',
    vertical: 'services',
    name: 'Professional Services',
    slug: 'services',
    icon: 'wrench',
    count: 230,
    storeCount: 31,
    description: 'Certified repair specialists, legal consultants, creatives & verified freelancers.',
    subCategories: [
      { id: 'tech_repairs', name: 'Phone & Tech Repairs', icon: 'cpu', count: 110 },
      { id: 'creative_services', name: 'Photography & Design', icon: 'camera', count: 65 },
      { id: 'education', name: 'Education & Coding', icon: 'graduation-cap', count: 55 }
    ]
  },

  // ── TRAVEL & MOBILITY DOMAIN ──
  {
    id: 'hotels',
    domain: 'travel',
    vertical: 'hotels',
    name: 'Hospitality & Stays',
    slug: 'hotels',
    icon: 'building',
    count: 142,
    storeCount: 24,
    description: 'Luxury hotel suites, serviced apartments, coastal resorts & verified guest houses.',
    subCategories: [
      { id: 'hotel_rooms', name: 'Hotel Suites & Lodging', icon: 'bed-double', count: 94 },
      { id: 'furnished_studios', name: 'Furnished Studios', icon: 'key', count: 48 }
    ]
  },
  {
    id: 'travel',
    domain: 'travel',
    vertical: 'travel',
    name: 'Travel & Mobility',
    slug: 'travel',
    icon: 'plane',
    count: 64,
    storeCount: 12,
    description: 'Intercity VIP bus tickets, flights, Camrail passenger trains & airport chauffeur.',
    subCategories: [
      { id: 'travel_bus', name: 'Intercity VIP Buses', icon: 'bus', count: 32 },
      { id: 'travel_flights', name: 'Domestic & Regional Flights', icon: 'plane', count: 20 },
      { id: 'travel_trains', name: 'Camrail Passenger Trains', icon: 'train', count: 12 }
    ]
  },

  // ── BUSINESS & FINANCE DOMAIN ──
  {
    id: 'real_estate',
    domain: 'business',
    vertical: 'real_estate',
    name: 'Real Estate & Property',
    slug: 'real-estate',
    icon: 'landmark',
    count: 88,
    storeCount: 15,
    description: 'Verified residential rentals, luxury duplexes, commercial offices & titled land plots.',
    subCategories: [
      { id: 'residential_property', name: 'Houses & Apartments', icon: 'home', count: 58 },
      { id: 'commercial_property', name: 'Offices & Commercial', icon: 'briefcase', count: 30 }
    ]
  },
  {
    id: 'banks',
    domain: 'business',
    vertical: 'banking',
    name: 'Banks & Financial Services',
    slug: 'banks',
    icon: 'credit-card',
    count: 28,
    storeCount: 14,
    description: 'Commercial banking branches, microfinance, insurance & mobile money agencies.',
    subCategories: [
      { id: 'commercial_banking', name: 'Commercial & Microfinance', icon: 'wallet', count: 28 }
    ]
  },
  {
    id: 'digital',
    domain: 'business',
    vertical: 'digital',
    name: 'Digital Products & Software',
    slug: 'digital',
    icon: 'download',
    count: 95,
    storeCount: 16,
    description: 'Software licenses, creative templates, online courses & SaaS subscriptions.',
    subCategories: [
      { id: 'software_licenses', name: 'Software & Templates', icon: 'code', count: 95 }
    ]
  }
];

export const curatedBrands = [
  { id: 'orca', name: 'Orca Electronics', category: 'Tech', location: 'Akwa, Douala' },
  { id: 'sawa', name: 'Sawa Luxury Hotel', category: 'Hospitality', location: 'Bonanjo, Douala' },
  { id: 'digital-corner', name: 'Digital Corner', category: 'Tech', location: 'Bonapriso, Douala' },
  { id: 'akwa-palm', name: 'Résidence Akwa Palm', category: 'Hospitality', location: 'Akwa, Douala' }
];
