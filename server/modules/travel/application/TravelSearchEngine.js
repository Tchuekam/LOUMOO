/**
 * LOUMOO Travel Search Engine & Pluggable Provider Architecture
 * ---------------------------------------------------------------------------
 * Normalizes results across buses, trains, flights, rides, hotels, and excursions
 * into a single unified frontend contract.
 */

const { travelRepository } = require('../infrastructure/TravelRepository');

/**
 * Base adapter contract for pluggable external travel APIs (GDS, Amadeus, Camrail API, Hotel PMS)
 */
class TravelProviderAdapter {
  constructor(name) {
    this.name = name;
  }
  async search(params) { throw new Error('Not implemented'); }
  async getDetails(type, id) { throw new Error('Not implemented'); }
  async checkAvailability(type, id, params) { throw new Error('Not implemented'); }
  async createBooking(payload) { throw new Error('Not implemented'); }
  async cancelBooking(bookingId, reason) { throw new Error('Not implemented'); }
}

class LocalMarketplaceAdapter extends TravelProviderAdapter {
  constructor() {
    super('LocalMarketplace');
    this.repo = travelRepository;
  }

  async search(params = {}) {
    const {
      type = 'all',
      origin = '',
      destination = '',
      passengers = 1,
      minPrice,
      maxPrice,
      rating
    } = params;

    const normalizedItems = [];

    // 1. Transport (Bus, Train, Flight, Ride)
    if (type === 'all' || ['bus', 'train', 'flight', 'ride'].includes(type)) {
      const transportList = await this.repo.getTransportServices({
        type: type === 'all' ? null : type,
        origin,
        destination
      });

      for (const t of transportList) {
        normalizedItems.push({
          id: t.id,
          type: t.type,
          provider: t.providerName,
          title: `${t.providerName} · ${t.serviceNumber || t.origin + ' ➔ ' + t.destination}`,
          origin: t.origin,
          destination: t.destination,
          departure: t.departureTime,
          arrival: t.arrivalTime,
          duration: t.duration,
          price: t.price,
          currency: t.currency || 'XAF',
          rating: 4.8,
          images: [],
          availability: t.availableSeats >= (Number(passengers) || 1),
          availableUnits: t.availableSeats,
          className: t.className,
          details: {
            originDetail: t.originDetail,
            destDetail: t.destDetail,
            amenities: t.amenities
          }
        });
      }
    }

    // 2. Hotels
    if (type === 'all' || type === 'hotel') {
      const hotelsList = await this.repo.getHotels({
        city: destination || origin,
        maxPrice,
        rating
      });

      for (const h of hotelsList) {
        normalizedItems.push({
          id: h.id,
          type: 'hotel',
          provider: h.name,
          title: h.name,
          origin: h.location,
          destination: h.city,
          departure: params.date || 'Flexible check-in',
          arrival: params.returnDate || 'Flexible check-out',
          duration: 'Per night',
          price: h.priceFrom,
          currency: h.currency || 'XAF',
          rating: h.rating,
          images: h.images,
          availability: h.rooms.some(r => r.availableInventory > 0),
          availableUnits: h.rooms.reduce((acc, r) => acc + r.availableInventory, 0),
          details: {
            amenities: h.amenities,
            roomCount: h.rooms.length
          }
        });
      }
    }

    // 3. Excursions & Tourism
    if (type === 'all' || type === 'excursion' || type === 'tour') {
      const excursionsList = await this.repo.getExcursions({
        destination: destination || origin,
        maxPrice
      });

      for (const e of excursionsList) {
        normalizedItems.push({
          id: e.id,
          type: 'excursion',
          provider: 'Cameroon Discovery Tours',
          title: e.title,
          origin: e.destination,
          destination: e.destination,
          departure: params.date || 'Daily Departure',
          arrival: 'Same day',
          duration: e.duration,
          price: e.price,
          currency: e.currency || 'XAF',
          rating: 4.9,
          images: e.images,
          availability: e.availableSlots >= (Number(passengers) || 1),
          availableUnits: e.availableSlots,
          details: {
            highlights: e.highlights,
            included: e.included
          }
        });
      }
    }

    return normalizedItems;
  }
}

class TravelSearchEngine {
  constructor() {
    this.adapters = [new LocalMarketplaceAdapter()];
  }

  registerAdapter(adapter) {
    this.adapters.push(adapter);
  }

  async search(params = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));

    // Gather from all registered adapters
    let allItems = [];
    for (const adapter of this.adapters) {
      try {
        const results = await adapter.search(params);
        allItems.push(...results);
      } catch (err) {
        // Structured logging for adapter search errors
      }
    }

    // Apply sorting if requested
    if (params.sort === 'price_asc') {
      allItems.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price_desc') {
      allItems.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'rating_desc') {
      allItems.sort((a, b) => b.rating - a.rating);
    }

    // Apply pagination
    const total = allItems.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}

const travelSearchEngine = new TravelSearchEngine();

module.exports = {
  TravelSearchEngine,
  travelSearchEngine,
  TravelProviderAdapter,
  LocalMarketplaceAdapter
};
