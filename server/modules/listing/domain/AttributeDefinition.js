/**
 * AttributeDefinition Domain Model & Dynamic Schema Validator
 * Enforces server-side validation for category-specific attributes.
 */

const { ValidationError } = require('../../../shared/errors/AppError');

class AttributeDefinition {
  constructor(data = {}) {
    this.id = data.id || null;
    this.categoryId = data.category_id || data.categoryId || null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.attributeType = data.attribute_type || data.attributeType || 'text'; // text, longtext, number, decimal, boolean, select, multi_select, color, measurement, currency
    this.isRequired = data.is_required ?? data.isRequired ?? false;
    this.isSearchable = data.is_searchable ?? data.isSearchable ?? true;
    this.isFilterable = data.is_filterable ?? data.isFilterable ?? true;
    this.isVariantOption = data.is_variant_option ?? data.isVariantOption ?? false;
    this.unit = data.unit || null;
    this.allowedValues = data.allowed_values || data.allowedValues || [];
    this.validationRules = data.validation_rules || data.validationRules || {};
    this.displayOrder = Number(data.display_order ?? data.displayOrder ?? 0);
  }

  validate(value) {
    // 1. Required check
    if (this.isRequired) {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        throw new ValidationError(`Attribute "${this.name}" is required for this category.`);
      }
    }

    if (value === undefined || value === null || value === '') {
      return true;
    }

    // 2. Type validation
    switch (this.attributeType) {
      case 'number':
      case 'decimal': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new ValidationError(`Attribute "${this.name}" must be a valid number.`);
        }
        if (this.validationRules.min !== undefined && num < this.validationRules.min) {
          throw new ValidationError(`Attribute "${this.name}" cannot be less than ${this.validationRules.min}.`);
        }
        if (this.validationRules.max !== undefined && num > this.validationRules.max) {
          throw new ValidationError(`Attribute "${this.name}" cannot exceed ${this.validationRules.max}.`);
        }
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new ValidationError(`Attribute "${this.name}" must be a boolean.`);
        }
        break;
      }
      case 'select': {
        if (this.allowedValues.length > 0) {
          const matched = this.allowedValues.some(v => 
            (typeof v === 'string' ? v.toLowerCase() : v.id?.toLowerCase()) === String(value).toLowerCase()
          );
          if (!matched) {
            throw new ValidationError(`Value "${value}" is not valid for "${this.name}". Allowed: ${this.allowedValues.join(', ')}`);
          }
        }
        break;
      }
      case 'multi_select': {
        if (!Array.isArray(value)) {
          throw new ValidationError(`Attribute "${this.name}" must be an array of selected options.`);
        }
        if (this.allowedValues.length > 0) {
          value.forEach(val => {
            const matched = this.allowedValues.some(v => 
              (typeof v === 'string' ? v.toLowerCase() : v.id?.toLowerCase()) === String(val).toLowerCase()
            );
            if (!matched) {
              throw new ValidationError(`Value "${val}" is not allowed in "${this.name}".`);
            }
          });
        }
        break;
      }
      case 'text':
      default: {
        if (typeof value !== 'string') {
          throw new ValidationError(`Attribute "${this.name}" must be a string.`);
        }
        if (this.validationRules.maxLength && value.length > this.validationRules.maxLength) {
          throw new ValidationError(`Attribute "${this.name}" exceeds max length of ${this.validationRules.maxLength} characters.`);
        }
        break;
      }
    }

    return true;
  }

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      name: this.name,
      slug: this.slug,
      attributeType: this.attributeType,
      isRequired: this.isRequired,
      isSearchable: this.isSearchable,
      isFilterable: this.isFilterable,
      isVariantOption: this.isVariantOption,
      unit: this.unit,
      allowedValues: this.allowedValues,
      validationRules: this.validationRules,
      displayOrder: this.displayOrder
    };
  }
}

module.exports = AttributeDefinition;
