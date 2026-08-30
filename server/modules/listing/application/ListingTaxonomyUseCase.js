/**
 * ListingTaxonomyUseCase (06.03 & Section 04 Dynamic Attributes)
 * Enterprise-grade hierarchical category taxonomy and dynamic attribute schema resolver.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const AttributeDefinition = require('../domain/AttributeDefinition');
const TaxonomyCategory = require('../domain/TaxonomyCategory');
const { NotFoundError, ValidationError } = require('../../../shared/errors/AppError');

// Foundational Centralized Taxonomy Dataset
const BASELINE_TAXONOMY = [
  {
    id: 'electronics',
    vertical: 'electronics',
    name: 'Electronics & Technology',
    slug: 'electronics',
    icon: 'laptop',
    level: 1,
    supported_listing_types: ['PHYSICAL_PRODUCT', 'BUNDLE', 'RENTAL'],
    children: [
      {
        id: 'smartphones',
        parentId: 'electronics',
        vertical: 'electronics',
        name: 'Smartphones & Mobile Devices',
        slug: 'smartphones',
        level: 2,
        supported_listing_types: ['PHYSICAL_PRODUCT'],
        attribute_definitions: [
          { name: 'Brand', slug: 'brand', attribute_type: 'select', is_required: true, allowed_values: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Tecno', 'Infinix', 'Huawei', 'Other'] },
          { name: 'Model', slug: 'model', attribute_type: 'text', is_required: true },
          { name: 'Storage Capacity', slug: 'storage', attribute_type: 'select', is_required: true, is_variant_option: true, allowed_values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
          { name: 'RAM Memory', slug: 'ram', attribute_type: 'select', is_required: false, allowed_values: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
          { name: 'Color', slug: 'color', attribute_type: 'select', is_required: true, is_variant_option: true, allowed_values: ['Space Grey', 'Silver', 'Gold', 'Midnight', 'Titanium Natural', 'Blue', 'Black'] },
          { name: 'Battery Health (%)', slug: 'battery_health', attribute_type: 'number', is_required: false, unit: '%', validation_rules: { min: 50, max: 100 } }
        ]
      },
      {
        id: 'laptops',
        parentId: 'electronics',
        vertical: 'electronics',
        name: 'Laptops & Computers',
        slug: 'laptops',
        level: 2,
        supported_listing_types: ['PHYSICAL_PRODUCT', 'RENTAL'],
        attribute_definitions: [
          { name: 'Brand', slug: 'brand', attribute_type: 'select', is_required: true, allowed_values: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Other'] },
          { name: 'Processor (CPU)', slug: 'processor', attribute_type: 'text', is_required: true },
          { name: 'RAM Size', slug: 'ram', attribute_type: 'select', is_required: true, is_variant_option: true, allowed_values: ['8GB', '16GB', '32GB', '64GB'] },
          { name: 'Storage SSD', slug: 'storage', attribute_type: 'select', is_required: true, is_variant_option: true, allowed_values: ['256GB', '512GB', '1TB', '2TB'] },
          { name: 'Screen Size', slug: 'screen_size', attribute_type: 'select', is_required: false, allowed_values: ['13.3"', '14"', '15.6"', '16"', '17"'] }
        ]
      }
    ]
  },
  {
    id: 'fashion',
    vertical: 'fashion',
    name: 'Fashion & Luxury',
    slug: 'fashion',
    icon: 'shirt',
    level: 1,
    supported_listing_types: ['PHYSICAL_PRODUCT', 'RENTAL'],
    children: [
      {
        id: 'footwear',
        parentId: 'fashion',
        vertical: 'fashion',
        name: 'Footwear & Shoes',
        slug: 'footwear',
        level: 2,
        supported_listing_types: ['PHYSICAL_PRODUCT'],
        attribute_definitions: [
          { name: 'Brand', slug: 'brand', attribute_type: 'text', is_required: false },
          { name: 'Shoe Size (EU)', slug: 'size', attribute_type: 'select', is_required: true, is_variant_option: true, allowed_values: ['38', '39', '40', '41', '42', '43', '44', '45', '46'] },
          { name: 'Gender', slug: 'gender', attribute_type: 'select', is_required: true, allowed_values: ['Men', 'Women', 'Unisex', 'Kids'] },
          { name: 'Material', slug: 'material', attribute_type: 'select', is_required: false, allowed_values: ['Genuine Leather', 'Suede', 'Canvas', 'Mesh', 'Synthetic'] },
          { name: 'Color', slug: 'color', attribute_type: 'text', is_required: true, is_variant_option: true }
        ]
      }
    ]
  },
  {
    id: 'services',
    vertical: 'services',
    name: 'Professional Services',
    slug: 'services',
    icon: 'wrench',
    level: 1,
    supported_listing_types: ['SERVICE', 'SUBSCRIPTION'],
    children: [
      {
        id: 'tech_repairs',
        parentId: 'services',
        vertical: 'services',
        name: 'Technology & Phone Repairs',
        slug: 'tech-repairs',
        level: 2,
        supported_listing_types: ['SERVICE'],
        attribute_definitions: [
          { name: 'Service Type', slug: 'service_type', attribute_type: 'select', is_required: true, allowed_values: ['Screen Replacement', 'Battery Swap', 'Water Damage Repair', 'Motherboard Diagnostic', 'Software Unlocking'] },
          { name: 'Estimated Duration', slug: 'duration', attribute_type: 'select', is_required: true, allowed_values: ['30 mins', '1 - 2 hours', 'Same Day', '24 - 48 hours'] },
          { name: 'Service Mode', slug: 'service_mode', attribute_type: 'select', is_required: true, allowed_values: ['In-Store Dropoff', 'Home / Office Onsite Visit', 'Courier Pickup'] }
        ]
      }
    ]
  },
  {
    id: 'hotels',
    vertical: 'hotels',
    name: 'Hospitality & Stays',
    slug: 'hotels',
    icon: 'building',
    level: 1,
    supported_listing_types: ['BOOKING'],
    children: [
      {
        id: 'hotel_rooms',
        parentId: 'hotels',
        vertical: 'hotels',
        name: 'Hotel Suites & Lodging',
        slug: 'hotel-rooms',
        level: 2,
        supported_listing_types: ['BOOKING'],
        attribute_definitions: [
          { name: 'Room Type', slug: 'room_type', attribute_type: 'select', is_required: true, allowed_values: ['Standard Room', 'Deluxe Ocean View', 'Executive Suite', 'Presidential Suite', 'Furnished Studio'] },
          { name: 'Max Guests', slug: 'max_guests', attribute_type: 'number', is_required: true, validation_rules: { min: 1, max: 10 } },
          { name: 'Bed Configuration', slug: 'bed_type', attribute_type: 'select', is_required: true, allowed_values: ['1 King Bed', '1 Queen Bed', '2 Twin Beds', '2 Double Beds'] },
          { name: 'Amenities', slug: 'amenities', attribute_type: 'multi_select', is_required: false, allowed_values: ['High-speed Wi-Fi', 'Swimming Pool', 'Air Conditioning', 'Free Breakfast', 'Airport Shuttle', 'Ocean Balcony', '24/7 Generator Power'] }
        ]
      }
    ]
  },
  {
    id: 'digital',
    vertical: 'digital',
    name: 'Digital Products & Software',
    slug: 'digital',
    icon: 'download',
    level: 1,
    supported_listing_types: ['DIGITAL_PRODUCT', 'SUBSCRIPTION'],
    children: [
      {
        id: 'software_licenses',
        parentId: 'digital',
        vertical: 'digital',
        name: 'Software, Templates & Courses',
        slug: 'software-licenses',
        level: 2,
        supported_listing_types: ['DIGITAL_PRODUCT'],
        attribute_definitions: [
          { name: 'License Type', slug: 'license_type', attribute_type: 'select', is_required: true, allowed_values: ['Personal Use', 'Commercial License', 'Lifetime Updates', 'Single Site License'] },
          { name: 'File Format / Delivery', slug: 'delivery_format', attribute_type: 'text', is_required: true },
          { name: 'Version', slug: 'version', attribute_type: 'text', is_required: false }
        ]
      }
    ]
  }
];

class ListingTaxonomyUseCase {
  static async getTaxonomyTree() {
    return await CacheService.remember('taxonomy:tree:all', 3600, async () => {
      return BASELINE_TAXONOMY.map(v => new TaxonomyCategory(v).toJSON());
    }, 'catalog');
  }

  static async findCategoryById(categoryId) {
    const all = await this.getTaxonomyTree();
    
    for (const v of all) {
      if (v.id === categoryId || v.slug === categoryId) return v;
      if (v.children) {
        for (const c of v.children) {
          if (c.id === categoryId || c.slug === categoryId) return c;
        }
      }
    }
    return null;
  }

  static async getCategoryAttributeSchema(categoryId) {
    const category = await this.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }

    const defs = (category.attributeDefinitions || []).map(a => new AttributeDefinition(a));
    return {
      categoryId: category.id,
      categoryName: category.name,
      vertical: category.vertical,
      supportedListingTypes: category.supportedListingTypes,
      attributes: defs.map(d => d.toJSON())
    };
  }

  static async validateAttributesForCategory(categoryId, submittedAttributes = {}) {
    const schema = await this.getCategoryAttributeSchema(categoryId);
    const defs = (schema.attributes || []).map(a => new AttributeDefinition(a));

    defs.forEach(def => {
      const val = submittedAttributes[def.slug];
      def.validate(val);
    });

    return true;
  }
}

module.exports = ListingTaxonomyUseCase;
