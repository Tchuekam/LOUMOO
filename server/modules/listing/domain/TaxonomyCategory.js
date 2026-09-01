/**
 * TaxonomyCategory Domain Model
 * Hierarchical commercial category entity supporting dynamic vertical schemas.
 */

class TaxonomyCategory {
  constructor(data = {}) {
    this.id = data.id || null;
    this.parentId = data.parent_id || data.parentId || null;
    this.domain = data.domain || 'shop';
    this.vertical = data.vertical || 'electronics';
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.icon = data.icon || 'tag';
    this.description = data.description || '';
    this.itemCount = Number(data.itemCount ?? data.item_count ?? 0);
    this.storeCount = Number(data.storeCount ?? data.store_count ?? 0);
    this.level = Number(data.level || 1); // 1: Vertical, 2: Category, 3: Subcategory, 4: Product Type
    this.supportedListingTypes = data.supported_listing_types || data.supportedListingTypes || ['PHYSICAL_PRODUCT'];
    this.isActive = data.is_active ?? data.isActive ?? true;
    this.displayOrder = Number(data.display_order ?? data.displayOrder ?? 0);
    this.attributeDefinitions = (data.attribute_definitions || data.attributeDefinitions || []).map(a => 
      a instanceof Object ? a : { slug: a }
    );
    this.children = (data.children || []).map(c => new TaxonomyCategory(c));
  }

  supportsListingType(type) {
    return this.supportedListingTypes.includes(type);
  }

  toJSON() {
    return {
      id: this.id,
      parentId: this.parentId,
      domain: this.domain,
      vertical: this.vertical,
      name: this.name,
      slug: this.slug,
      icon: this.icon,
      description: this.description,
      itemCount: this.itemCount,
      storeCount: this.storeCount,
      level: this.level,
      supportedListingTypes: this.supportedListingTypes,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      attributeDefinitions: this.attributeDefinitions,
      children: this.children.map(c => c.toJSON())
    };
  }
}

module.exports = TaxonomyCategory;
