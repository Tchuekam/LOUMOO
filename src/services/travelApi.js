/**
 * LOUMOO Travel Frontend API Client
 * ---------------------------------------------------------------------------
 * Communicates with backend endpoints at /api/travel/* with automatic
 * error recovery, idempotency key generation, and typing contract.
 */

const API_BASE = '/api/travel';

class TravelApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async _resolveToken() {
    if (typeof window === 'undefined') return null;
    if (window.LoumooAPI && typeof window.LoumooAPI.resolveToken === 'function') {
      try {
        const token = await window.LoumooAPI.resolveToken();
        if (token) return token;
      } catch (e) {}
    }
    if (window.loumooApi && typeof window.loumooApi.resolveToken === 'function') {
      try {
        const token = await window.loumooApi.resolveToken();
        if (token) return token;
      } catch (e) {}
    }
    try {
      return localStorage.getItem('loumoo_token') ||
             localStorage.getItem('loumoo_auth_token') ||
             sessionStorage.getItem('loumoo_token') ||
             null;
    } catch (e) {
      return null;
    }
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this._resolveToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error?.message || `Request failed with status ${response.status}`;
        const err = new Error(errorMsg);
        err.code = data.error?.code || 'API_ERROR';
        err.status = response.status;
        throw err;
      }
      return data;
    } catch (err) {
      // Re-throw with clean structure
      throw err;
    }
  }

  // 1. Unified Search
  async search(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, val);
      }
    });
    return this._request(`/search?${query.toString()}`);
  }

  // 2. Destinations
  async getDestinations() {
    return this._request('/destinations');
  }

  // 3. Hotels
  async getHotels(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/hotels?${query.toString()}`);
  }

  async getHotel(id) {
    return this._request(`/hotels/${encodeURIComponent(id)}`);
  }

  async getHotelRooms(id, { checkIn, checkOut, guests } = {}) {
    const query = new URLSearchParams();
    if (checkIn) query.set('checkIn', checkIn);
    if (checkOut) query.set('checkOut', checkOut);
    if (guests) query.set('guests', guests);
    return this._request(`/hotels/${encodeURIComponent(id)}/rooms?${query.toString()}`);
  }

  // 4. Excursions
  async getExcursions(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/excursions?${query.toString()}`);
  }

  async getExcursion(id) {
    return this._request(`/excursions/${encodeURIComponent(id)}`);
  }

  // 5. Transport Modalities
  async getBuses(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/buses?${query.toString()}`);
  }

  async getBusSeats(scheduleId) {
    return this._request(`/bus/seats/${encodeURIComponent(scheduleId)}`);
  }

  async getTrains(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/trains?${query.toString()}`);
  }

  async getFlights(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/flights?${query.toString()}`);
  }

  async getRideQuote(params = {}) {
    const query = new URLSearchParams(params);
    return this._request(`/rides?${query.toString()}`);
  }

  // 6. Bookings (with Idempotency Key)
  async createBooking(payload, idempotencyKey = null) {
    const headers = {};
    const key = idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    headers['X-Idempotency-Key'] = key;

    return this._request('/bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  async getBooking(id) {
    return this._request(`/bookings/${encodeURIComponent(id)}`);
  }

  async cancelBooking(id, reason = 'Customer request') {
    return this._request(`/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // 7. Trips & Tickets
  async getTrips(status = 'all') {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.set('status', status);
    const qs = query.toString();
    return this._request(`/trips${qs ? `?${qs}` : ''}`);
  }

  async getTrip(tripId) {
    return this._request(`/trips/${encodeURIComponent(tripId)}`);
  }

  async getTickets() {
    return this._request('/tickets');
  }

  async getTicket(ticketId) {
    return this._request(`/tickets/${encodeURIComponent(ticketId)}`);
  }
}

const travelApi = new TravelApiClient();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TravelApiClient, travelApi };
}
