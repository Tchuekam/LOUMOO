/**
 * ListingPreviewUseCase (06.13 Listing Preview)
 * Assembles a high-fidelity PDP projection identical to the customer-facing view.
 */

class ListingPreviewUseCase {
  static async getPreview(listing, store = null) {
    const pub = listing.toPublicJSON();
    return {
      ...pub,
      isPreview: true,
      previewLabel: 'PREVIEW — NOT PUBLIC',
      store: store ? {
        id: store.id,
        name: store.name,
        slug: store.slug,
        isVerified: store.isVerified,
        rating: store.rating || 5.0,
        city: store.city || 'Douala'
      } : {
        name: 'Merchant Boutique',
        city: 'Douala',
        isVerified: true
      }
    };
  }
}

module.exports = ListingPreviewUseCase;
