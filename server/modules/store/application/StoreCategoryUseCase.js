/**
 * Store Category Use Case (05.06 & Section 13 Business Categories)
 * Centralizes commercial taxonomy across products, services, hospitality, and storefronts.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');

const BUSINESS_CATEGORIES = [
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    slug: 'electronics',
    icon: 'laptop',
    description: 'Smartphones, laptops, audio, solar, appliances & accessories',
    subcategories: ['smartphones', 'laptops', 'audio_headphones', 'solar_power', 'home_appliances']
  },
  {
    id: 'fashion',
    name: 'Fashion & Luxury',
    slug: 'fashion',
    icon: 'shirt',
    description: 'Apparel, shoes, watches, jewelry, traditional fabrics & cosmetics',
    subcategories: ['mens_fashion', 'womens_fashion', 'footwear', 'watches_jewelry', 'traditional_wear']
  },
  {
    id: 'home',
    name: 'Home & Living',
    slug: 'home',
    icon: 'home',
    description: 'Furniture, decor, kitchenware, bedding & construction materials',
    subcategories: ['furniture', 'kitchen_dining', 'decor_lighting', 'bedding']
  },
  {
    id: 'services',
    name: 'Professional Services',
    slug: 'services',
    icon: 'wrench',
    description: 'Solar technicians, IT repair, legal, photography, tutoring & beauty',
    subcategories: ['tech_repair', 'solar_installation', 'photography', 'tutoring', 'legal_consulting']
  },
  {
    id: 'hotels',
    name: 'Hospitality & Lodging',
    slug: 'hotels',
    icon: 'building',
    description: 'Luxury hotels, beach resorts, furnished apartments & guest houses',
    subcategories: ['luxury_hotels', 'beach_resorts', 'furnished_apartments', 'guest_houses']
  },
  {
    id: 'food',
    name: 'Food & Organic Market',
    slug: 'food',
    icon: 'utensils',
    description: 'Fresh seafood, local spices, packaged goods & restaurant takeout',
    subcategories: ['fresh_seafood', 'spices_seasonings', 'organic_produce', 'beverages']
  }
];

class StoreCategoryUseCase {
  static async listCategories() {
    const cacheKey = 'stores:categories:all';
    return await CacheService.remember(cacheKey, 600, async () => {
      return BUSINESS_CATEGORIES;
    }, 'catalog');
  }

  static async getCategoryById(id) {
    const categories = await this.listCategories();
    return categories.find(c => c.id === id || c.slug === id) || null;
  }
}

module.exports = StoreCategoryUseCase;
