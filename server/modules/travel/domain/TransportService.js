/**
 * LOUMOO Transport Service Domain Entity (Bus, Train, Flight, Ride)
 */

class TransportSeat {
  constructor(data = {}) {
    this.id = data.id || `seat_${data.seatNumber || data.seatId}`;
    this.seatNumber = data.seatNumber || data.seatId || '';
    this.row = Number(data.row || data.rowNum || 1);
    this.column = data.column || data.columnLetter || 'A';
    this.isWindow = Boolean(data.isWindow);
    this.isAisle = Boolean(data.isAisle);
    this.status = (data.status || 'AVAILABLE').toUpperCase(); // AVAILABLE, RESERVED, BOOKED
    this.price = Number(data.price ?? 0);
  }

  isAvailable() {
    return this.status === 'AVAILABLE';
  }

  reserve() {
    if (!this.isAvailable()) {
      throw new Error(`Seat '${this.seatNumber}' is not available (current status: ${this.status})`);
    }
    this.status = 'BOOKED';
    return this;
  }

  release() {
    this.status = 'AVAILABLE';
    return this;
  }

  toJSON() {
    return {
      seatId: this.seatNumber,
      seatNumber: this.seatNumber,
      row: this.row,
      column: this.column,
      isWindow: this.isWindow,
      isAisle: this.isAisle,
      status: this.status,
      price: this.price
    };
  }
}

class TransportService {
  constructor(data = {}) {
    this.id = data.id || `srv_${Date.now()}`;
    this.providerId = data.providerId || data.provider_id || data.operatorId || '';
    this.providerName = data.providerName || data.operatorName || data.airline || 'LOUMOO Transport';
    this.type = (data.type || 'bus').toLowerCase(); // bus, train, flight, ride
    this.serviceNumber = data.serviceNumber || data.flightNumber || data.trainNumber || data.route || '';
    this.origin = (data.origin || '').trim();
    this.destination = (data.destination || '').trim();
    this.originDetail = data.originDetail || data.terminal || '';
    this.destDetail = data.destDetail || '';
    this.departureTime = data.departureTime || data.departure || '';
    this.arrivalTime = data.arrivalTime || data.arrival || '';
    this.duration = data.duration || '4h 00m';
    this.className = data.className || data.busClass || 'Standard';
    this.capacity = Number(data.capacity || data.totalSeats || 40);
    this.price = Number(data.price || data.basePrice || 0);
    this.currency = data.currency || 'XAF';
    this.status = data.status || 'SCHEDULED';
    this.amenities = Array.isArray(data.amenities) ? data.amenities : [];
    this.layoutType = data.layoutType || '2x2';

    // Seat inventory
    this.occupiedSeats = new Set(Array.isArray(data.occupiedSeats) ? data.occupiedSeats : []);
    this.availableSeats = Math.max(0, this.capacity - this.occupiedSeats.size);
  }

  isSeatAvailable(seatNumber) {
    return !this.occupiedSeats.has(seatNumber);
  }

  reserveSeat(seatNumber) {
    if (!seatNumber) return true;
    if (this.occupiedSeats.has(seatNumber)) {
      throw new Error(`Seat '${seatNumber}' is already occupied on service ${this.serviceNumber || this.id}`);
    }
    this.occupiedSeats.add(seatNumber);
    this.availableSeats = Math.max(0, this.capacity - this.occupiedSeats.size);
    return true;
  }

  releaseSeat(seatNumber) {
    if (!seatNumber) return true;
    this.occupiedSeats.delete(seatNumber);
    this.availableSeats = Math.max(0, this.capacity - this.occupiedSeats.size);
    return true;
  }

  getSeatMap() {
    const layout = [];
    const totalRows = this.layoutType === '2x1' ? 7 : Math.ceil(this.capacity / (this.layoutType === '2x1' ? 3 : 4));
    const cols = this.layoutType === '2x1' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

    for (let r = 1; r <= totalRows; r++) {
      const rowSeats = [];
      for (const col of cols) {
        const seatId = `${r}${col}`;
        const isOccupied = this.occupiedSeats.has(seatId);
        rowSeats.push(new TransportSeat({
          seatNumber: seatId,
          row: r,
          column: col,
          isWindow: col === 'A' || col === cols[cols.length - 1],
          isAisle: col === 'B' || col === 'C',
          status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
          price: this.price
        }));
      }
      layout.push({ row: r, seats: rowSeats.map(s => s.toJSON()) });
    }

    return {
      serviceId: this.id,
      scheduleId: this.id,
      providerName: this.providerName,
      operatorName: this.providerName,
      type: this.type,
      className: this.className,
      busClass: this.className,
      layoutType: this.layoutType,
      totalSeats: this.capacity,
      availableSeatsCount: this.availableSeats,
      occupiedSeats: Array.from(this.occupiedSeats),
      seatLayout: layout
    };
  }

  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      providerName: this.providerName,
      type: this.type,
      serviceNumber: this.serviceNumber,
      origin: this.origin,
      destination: this.destination,
      originDetail: this.originDetail,
      destDetail: this.destDetail,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      duration: this.duration,
      className: this.className,
      capacity: this.capacity,
      availableSeats: this.availableSeats,
      price: this.price,
      currency: this.currency,
      status: this.status,
      amenities: this.amenities,
      occupiedSeats: Array.from(this.occupiedSeats)
    };
  }
}

module.exports = { TransportService, TransportSeat };
