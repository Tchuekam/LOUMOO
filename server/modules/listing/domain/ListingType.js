/**
 * ListingType Domain Enum & Capabilities Engine
 * Supports all 7 commerce models under the Universal Listing Core.
 */

const LISTING_TYPES = Object.freeze({
  PHYSICAL_PRODUCT: 'PHYSICAL_PRODUCT',
  DIGITAL_PRODUCT: 'DIGITAL_PRODUCT',
  SERVICE: 'SERVICE',
  BOOKING: 'BOOKING',
  RENTAL: 'RENTAL',
  SUBSCRIPTION: 'SUBSCRIPTION',
  BUNDLE: 'BUNDLE'
});

const LISTING_CAPABILITIES = Object.freeze({
  [LISTING_TYPES.PHYSICAL_PRODUCT]: {
    label: 'Physical Product',
    description: 'Smartphones, fashion, appliances, hardware, food & physical inventory',
    hasInventory: true,
    hasVariants: true,
    hasShipping: true,
    hasDigitalDelivery: false,
    hasServiceSchedule: false,
    hasBookingDates: false,
    hasRentalDeposit: false,
    hasRecurringBilling: false,
    hasBundleComponents: false,
    requiresCondition: true
  },
  [LISTING_TYPES.DIGITAL_PRODUCT]: {
    label: 'Digital Product',
    description: 'Ebooks, software, templates, media, courses & download licenses',
    hasInventory: false,
    hasVariants: true,
    hasShipping: false,
    hasDigitalDelivery: true,
    hasServiceSchedule: false,
    hasBookingDates: false,
    hasRentalDeposit: false,
    hasRecurringBilling: false,
    hasBundleComponents: false,
    requiresCondition: false
  },
  [LISTING_TYPES.SERVICE]: {
    label: 'Professional Service',
    description: 'Tech repairs, solar installation, tutoring, beauty, photography, consulting',
    hasInventory: false,
    hasVariants: true,
    hasShipping: false,
    hasDigitalDelivery: false,
    hasServiceSchedule: true,
    hasBookingDates: false,
    hasRentalDeposit: false,
    hasRecurringBilling: false,
    hasBundleComponents: false,
    requiresCondition: false
  },
  [LISTING_TYPES.BOOKING]: {
    label: 'Hospitality & Booking',
    description: 'Hotel suites, beach resorts, event tickets, conferences & experiences',
    hasInventory: false,
    hasVariants: true,
    hasShipping: false,
    hasDigitalDelivery: false,
    hasServiceSchedule: false,
    hasBookingDates: true,
    hasRentalDeposit: false,
    hasRecurringBilling: false,
    hasBundleComponents: false,
    requiresCondition: false
  },
  [LISTING_TYPES.RENTAL]: {
    label: 'Rental & Hire',
    description: 'Car rentals, cameras, event equipment, furnished apartments & machinery',
    hasInventory: true,
    hasVariants: true,
    hasShipping: true,
    hasDigitalDelivery: false,
    hasServiceSchedule: false,
    hasBookingDates: true,
    hasRentalDeposit: true,
    hasRecurringBilling: false,
    hasBundleComponents: false,
    requiresCondition: true
  },
  [LISTING_TYPES.SUBSCRIPTION]: {
    label: 'Subscription & Membership',
    description: 'Gym memberships, recurring software plans, VIP club access',
    hasInventory: false,
    hasVariants: true,
    hasShipping: false,
    hasDigitalDelivery: true,
    hasServiceSchedule: false,
    hasBookingDates: false,
    hasRentalDeposit: false,
    hasRecurringBilling: true,
    hasBundleComponents: false,
    requiresCondition: false
  },
  [LISTING_TYPES.BUNDLE]: {
    label: 'Package & Bundle',
    description: 'Phone + accessories bundles, gift hampers, travel packages',
    hasInventory: true,
    hasVariants: false,
    hasShipping: true,
    hasDigitalDelivery: false,
    hasServiceSchedule: false,
    hasBookingDates: false,
    hasRentalDeposit: false,
    hasRecurringBilling: false,
    hasBundleComponents: true,
    requiresCondition: true
  }
});

class ListingType {
  static get TYPES() {
    return LISTING_TYPES;
  }

  static isValid(type) {
    return !!LISTING_TYPES[type];
  }

  static getCapabilities(type) {
    return LISTING_CAPABILITIES[type] || LISTING_CAPABILITIES[LISTING_TYPES.PHYSICAL_PRODUCT];
  }

  static getAllTypesWithMetadata() {
    return Object.keys(LISTING_TYPES).map(key => ({
      type: key,
      ...LISTING_CAPABILITIES[key]
    }));
  }
}

module.exports = ListingType;
