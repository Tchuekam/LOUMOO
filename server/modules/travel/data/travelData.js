/**
 * LOUMOO TRAVEL & MOBILITY DATASET (CAMEROON & CEMAC)
 * Official bus operators, flight routes, Camrail passenger lines, airport taxis,
 * curated tourism excursions, and consular visa requirements.
 */

const travelData = {
  // 1. Official Intercity Bus Operators
  busOperators: [
    {
      id: 'op-general-express',
      name: 'General Express Voyages',
      shortName: 'General Express',
      slug: 'general-express-voyages',
      verified: true,
      rating: 4.7,
      reviewsCount: 1420,
      headquarters: 'Douala, Cameroon',
      phone: '+237 677 00 11 22',
      whatsapp: '+237 677 00 11 22',
      terminals: {
        Douala: 'Terminal Bépanda & Mvan Express',
        Yaoundé: 'Terminal Mvan Central',
        Bafoussam: 'Gare Routière Centrale'
      },
      fleet: ['Marcopolo Paradiso 1200 G7', 'Mercedes-Benz Travego VIP'],
      classes: ['VIP Prestige', 'Executive Classic'],
      amenities: ['Wi-Fi 6', 'Air Conditioned', 'USB Ports', 'Reclining Seats', 'Restroom Onboard', 'Snack Service']
    },
    {
      id: 'op-touristique',
      name: 'Touristique Express VIP',
      shortName: 'Touristique Express',
      slug: 'touristique-express-vip',
      verified: true,
      rating: 4.8,
      reviewsCount: 980,
      headquarters: 'Yaoundé, Cameroon',
      phone: '+237 699 33 44 55',
      whatsapp: '+237 699 33 44 55',
      terminals: {
        Douala: 'Gare VIP Bessengue',
        Yaoundé: 'Terminal Tongolo VIP',
        Ngaoundéré: 'Gare Routière Grand Nord',
        Garoua: 'Agence Centrale Plateau',
        Maroua: 'Agence Centrale Djarengol'
      },
      fleet: ['Irizar i6S VIP Sleeper', 'Scania Touring HD'],
      classes: ['Prestige Sleeper', 'VIP Business'],
      amenities: ['Wi-Fi 6', 'Full Recline Sleeper', 'Individual Screens', 'AC', 'Hot Drinks', 'Restroom']
    },
    {
      id: 'op-finexs',
      name: 'Finexs Voyages',
      shortName: 'Finexs',
      slug: 'finexs-voyages',
      verified: true,
      rating: 4.9,
      reviewsCount: 2150,
      headquarters: 'Douala (Akwa), Cameroon',
      phone: '+237 690 12 34 56',
      whatsapp: '+237 690 12 34 56',
      terminals: {
        Douala: 'Terminal Akwa Boulevard de la Liberté',
        Yaoundé: 'Terminal Tongolo / Bastos Express'
      },
      fleet: ['Volvo 9700 Luxury Coach', 'Mercedes-Benz VIP Club'],
      classes: ['VIP Prestige', 'First Class'],
      amenities: ['High-speed Wi-Fi', 'Luxury Leather Seats', 'AC', 'USB-C Fast Charging', 'Onboard Refreshments']
    },
    {
      id: 'op-buca',
      name: 'Buca Voyages',
      shortName: 'Buca',
      slug: 'buca-voyages',
      verified: true,
      rating: 4.6,
      reviewsCount: 1670,
      headquarters: 'Yaoundé, Cameroon',
      phone: '+237 675 88 99 00',
      whatsapp: '+237 675 88 99 00',
      terminals: {
        Douala: 'Terminal Mboppi & Bépanda',
        Yaoundé: 'Terminal Mvan Buca',
        Kribi: 'Agence Océan Kribi'
      },
      fleet: ['Marcopolo Viaggio 1050', 'Yutong High-Deck Executive'],
      classes: ['Executive', 'Classic Standard'],
      amenities: ['AC', 'USB Charging', 'Reclining Seats', 'Luggage Tracker']
    }
  ],

  // 2. Bus Schedules & Inventory
  busSchedules: [
    {
      id: 'bus-sch-1',
      operatorId: 'op-general-express',
      operatorName: 'General Express Voyages',
      operatorVerified: true,
      route: 'Douala (Bépanda) → Yaoundé (Mvan)',
      origin: 'Douala',
      destination: 'Yaoundé',
      departureTime: '06:00',
      arrivalTime: '09:45',
      duration: '3h 45m',
      busClass: 'VIP Prestige',
      busClassId: 'vip',
      price: 6000,
      currency: 'XAF',
      totalSeats: 28,
      availableSeats: 8,
      occupiedSeats: ['1A', '1B', '2A', '2B', '3A', '5A', '6B', '7A', '7B'],
      layoutType: '2x1',
      amenities: ['Wi-Fi 6', 'AC', 'USB Ports', 'Reclining Seats', 'Restroom']
    },
    {
      id: 'bus-sch-2',
      operatorId: 'op-finexs',
      operatorName: 'Finexs Voyages',
      operatorVerified: true,
      route: 'Douala (Akwa) → Yaoundé (Tongolo)',
      origin: 'Douala',
      destination: 'Yaoundé',
      departureTime: '07:30',
      arrivalTime: '11:15',
      duration: '3h 45m',
      busClass: 'VIP Prestige',
      busClassId: 'vip',
      price: 7500,
      currency: 'XAF',
      totalSeats: 28,
      availableSeats: 12,
      occupiedSeats: ['1A', '2C', '3A', '4A', '5C'],
      layoutType: '2x1',
      amenities: ['High-speed Wi-Fi', 'Luxury Leather', 'AC', 'USB-C', 'Snacks']
    },
    {
      id: 'bus-sch-3',
      operatorId: 'op-touristique',
      operatorName: 'Touristique Express VIP',
      operatorVerified: true,
      route: 'Douala → Ngaoundéré',
      origin: 'Douala',
      destination: 'Ngaoundéré',
      departureTime: '12:00',
      arrivalTime: '06:00',
      nextDayArrival: true,
      duration: '18h 00m',
      busClass: 'Prestige Sleeper',
      busClassId: 'sleeper',
      price: 18000,
      currency: 'XAF',
      totalSeats: 24,
      availableSeats: 6,
      occupiedSeats: ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '5B', '6A'],
      layoutType: '2x1',
      amenities: ['Full Sleeper', 'Hot Meals', 'AC', 'Individual Screens', 'Restroom']
    },
    {
      id: 'bus-sch-4',
      operatorId: 'op-buca',
      operatorName: 'Buca Voyages',
      operatorVerified: true,
      route: 'Douala (Mboppi) → Kribi (Centre)',
      origin: 'Douala',
      destination: 'Kribi',
      departureTime: '08:00',
      arrivalTime: '10:30',
      duration: '2h 30m',
      busClass: 'Executive',
      busClassId: 'exec',
      price: 4500,
      currency: 'XAF',
      totalSeats: 50,
      availableSeats: 22,
      occupiedSeats: ['1A', '1B', '1C', '2A', '2B'],
      layoutType: '2x2',
      amenities: ['AC', 'Reclining Seats', 'USB Charging']
    },
    {
      id: 'bus-sch-5',
      operatorId: 'op-general-express',
      operatorName: 'General Express Voyages',
      operatorVerified: true,
      route: 'Yaoundé (Mvan) → Bafoussam (Centre)',
      origin: 'Yaoundé',
      destination: 'Bafoussam',
      departureTime: '09:00',
      arrivalTime: '13:00',
      duration: '4h 00m',
      busClass: 'VIP Prestige',
      busClassId: 'vip',
      price: 5500,
      currency: 'XAF',
      totalSeats: 28,
      availableSeats: 14,
      occupiedSeats: ['1A', '2B', '3A'],
      layoutType: '2x1',
      amenities: ['Wi-Fi', 'AC', 'USB Charging', 'Reclining Seats']
    }
  ],

  // 3. Flight Schedules
  flights: [
    {
      id: 'fl-1',
      airline: 'Air France',
      flightNumber: 'AF949',
      aircraft: 'Boeing 777-300ER',
      route: 'DLA (Douala) → CDG (Paris)',
      origin: 'Douala',
      originCode: 'DLA',
      originTerminal: 'Terminal 1',
      destination: 'Paris',
      destinationCode: 'CDG',
      destinationTerminal: 'Terminal 2E',
      departureTime: '23:45',
      arrivalTime: '06:50',
      nextDayArrival: true,
      duration: '6h 05m',
      stops: 'Direct Non-Stop',
      stopsCount: 0,
      cabinClass: 'Economy',
      price: 485000,
      currency: 'XAF',
      baggage: '2x 23 kg checked bags included',
      refundable: 'Flexible rebooking available',
      mealIncluded: true
    },
    {
      id: 'fl-2',
      airline: 'Brussels Airlines',
      flightNumber: 'SN371',
      aircraft: 'Airbus A330-300',
      route: 'DLA (Douala) → BRU (Brussels)',
      origin: 'Douala',
      originCode: 'DLA',
      originTerminal: 'Terminal 1',
      destination: 'Brussels',
      destinationCode: 'BRU',
      destinationTerminal: 'Terminal B',
      departureTime: '22:15',
      arrivalTime: '06:10',
      nextDayArrival: true,
      duration: '6h 55m',
      stops: 'Direct Non-Stop',
      stopsCount: 0,
      cabinClass: 'Economy',
      price: 440000,
      currency: 'XAF',
      baggage: '2x 23 kg checked bags',
      refundable: 'Standard fare rules',
      mealIncluded: true
    },
    {
      id: 'fl-3',
      airline: 'Camair-Co',
      flightNumber: 'QC204',
      aircraft: 'Bombardier Dash 8 Q400',
      route: 'DLA (Douala) → NSI (Yaoundé)',
      origin: 'Douala',
      originCode: 'DLA',
      originTerminal: 'Terminal National',
      destination: 'Yaoundé',
      destinationCode: 'NSI',
      destinationTerminal: 'Terminal Nsimalen',
      departureTime: '08:30',
      arrivalTime: '09:15',
      duration: '45m',
      stops: 'Direct Non-Stop',
      stopsCount: 0,
      cabinClass: 'Economy Standard',
      price: 48500,
      currency: 'XAF',
      baggage: '1x 23 kg checked + 8 kg cabin',
      refundable: 'Standard domestic',
      mealIncluded: false
    },
    {
      id: 'fl-4',
      airline: 'Ethiopian Airlines',
      flightNumber: 'ET912',
      aircraft: 'Boeing 787-9 Dreamliner',
      route: 'DLA (Douala) → NBO (Nairobi)',
      origin: 'Douala',
      originCode: 'DLA',
      originTerminal: 'Terminal 1',
      destination: 'Nairobi',
      destinationCode: 'NBO',
      destinationTerminal: 'Terminal 1A',
      departureTime: '13:20',
      arrivalTime: '20:45',
      duration: '5h 25m',
      stops: '1 Stop via ADD',
      stopsCount: 1,
      cabinClass: 'Economy',
      price: 365000,
      currency: 'XAF',
      baggage: '2x 23 kg checked',
      refundable: 'Standard international',
      mealIncluded: true
    }
  ],

  // 4. Camrail Passenger Train Schedules
  trains: [
    {
      id: 'train-1',
      operator: 'Camrail InterCity Express',
      trainNumber: 'IC 182',
      route: 'Douala (Gare Bessengue) → Yaoundé (Gare Voyageurs)',
      origin: 'Douala',
      destination: 'Yaoundé',
      departureTime: '06:00',
      arrivalTime: '09:40',
      duration: '3h 40m',
      trainClass: '1st Class VIP',
      trainClassId: 'vip',
      price: 9000,
      currency: 'XAF',
      amenities: ['Air Conditioned', 'Complimentary Breakfast', 'Power Plugs', 'Quiet Coach'],
      availableSeats: 18
    },
    {
      id: 'train-2',
      operator: 'Camrail InterCity Express',
      trainNumber: 'IC 184',
      route: 'Douala (Gare Bessengue) → Yaoundé (Gare Voyageurs)',
      origin: 'Douala',
      destination: 'Yaoundé',
      departureTime: '14:30',
      arrivalTime: '18:10',
      duration: '3h 40m',
      trainClass: '2nd Class Standard',
      trainClassId: 'standard',
      price: 5000,
      currency: 'XAF',
      amenities: ['Comfortable Seating', 'Luggage Compartment', 'Bar Car Access'],
      availableSeats: 45
    },
    {
      id: 'train-3',
      operator: 'Camrail Transcam Overnight',
      trainNumber: 'TR 192',
      route: 'Yaoundé (Gare Voyageurs) → Ngaoundéré (Gare)',
      origin: 'Yaoundé',
      destination: 'Ngaoundéré',
      departureTime: '19:15',
      arrivalTime: '08:45',
      nextDayArrival: true,
      duration: '13h 30m',
      trainClass: 'Couchette Sleeper (2-Berth)',
      trainClassId: 'sleeper',
      price: 24000,
      currency: 'XAF',
      amenities: ['Private Couchette', 'Bedding & Linen', 'Dinner Service', 'Security Guard'],
      availableSeats: 8
    }
  ],

  // 5. Taxi & Private Transfers
  taxis: [
    {
      id: 'taxi-city',
      type: 'city',
      name: 'On-Demand City Ride',
      description: 'Immediate ride in Douala or Yaoundé with verified driver',
      basePrice: 2500,
      perKm: 300,
      etaMinutes: 6,
      currency: 'XAF',
      vehicleClasses: [
        { id: 'standard', name: 'Standard City Cab', capacity: '3 Passengers', icon: '🚗', multiplier: 1.0 },
        { id: 'comfort', name: 'Comfort Sedan (AC)', capacity: '4 Passengers', icon: '🚙', multiplier: 1.4 },
        { id: 'vip', name: 'VIP SUV 4x4', capacity: '4 Passengers · Luxury', icon: '🚘', multiplier: 2.2 }
      ]
    },
    {
      id: 'taxi-airport-dla',
      type: 'airport',
      name: 'Douala Airport (DLA) Transfer',
      description: 'Fixed-price private airport transfer with flight tracking',
      basePrice: 12000,
      currency: 'XAF',
      etaMinutes: 15,
      vehicleClasses: [
        { id: 'comfort', name: 'Comfort Sedan (AC)', capacity: '3 Bags · 3 Pax', icon: '🚙', price: 12000 },
        { id: 'vip', name: 'VIP Executive SUV', capacity: '5 Bags · 4 Pax', icon: '🚘', price: 20000 },
        { id: 'van', name: 'Executive Van 8-Pax', capacity: '8 Bags · 8 Pax', icon: '🚐', price: 30000 }
      ]
    },
    {
      id: 'taxi-airport-nsi',
      type: 'airport',
      name: 'Yaoundé Nsimalen (NSI) Transfer',
      description: 'Fixed-price airport shuttle between Yaoundé city and NSI',
      basePrice: 15000,
      currency: 'XAF',
      etaMinutes: 20,
      vehicleClasses: [
        { id: 'comfort', name: 'Comfort Sedan (AC)', capacity: '3 Bags · 3 Pax', icon: '🚙', price: 15000 },
        { id: 'vip', name: 'VIP Executive SUV', capacity: '5 Bags · 4 Pax', icon: '🚘', price: 25000 }
      ]
    },
    {
      id: 'taxi-intercity-kribi',
      type: 'intercity',
      name: 'Douala ⇄ Kribi Private Beach Transfer',
      description: 'Door-to-door private chauffeur to Kribi beachfront hotels',
      basePrice: 45000,
      currency: 'XAF',
      duration: '2h 15m',
      vehicleClasses: [
        { id: 'comfort', name: 'Comfort Sedan (AC)', capacity: '4 Pax', icon: '🚙', price: 45000 },
        { id: 'vip', name: 'Toyota Prado VIP 4x4', capacity: '5 Pax', icon: '🚘', price: 75000 }
      ]
    }
  ],

  // 6. Tourism & Holiday Packages
  packages: [
    {
      id: 'pkg-1',
      slug: 'kribi-beach-lobe-falls-escape',
      title: 'Kribi Beach & Lobé Waterfalls Escape',
      destination: 'Kribi, South Region, Cameroon',
      duration: '3 Days / 2 Nights',
      durationDays: 3,
      price: 120000,
      currency: 'XAF',
      rating: 4.9,
      reviewsCount: 86,
      organizer: 'Cameroon Discovery Tours (Licensed)',
      badge: 'POPULAR WEEKEND',
      highlights: ['Beachfront Luxury Lodge', 'Canoe Ride to Lobé Falls', 'Fresh Seafood Dinner', 'Pygmy Village Walk'],
      itinerary: [
        { day: 1, title: 'Arrival & Grand Batanga Sunset', details: 'Private pickup from Douala/Yaoundé, check-in at Tara Plage Resort, welcome tropical cocktail, beach seafood barbecue.' },
        { day: 2, title: 'Lobé Waterfalls & Indigenous Culture', details: 'Morning traditional pirogue excursion to where waterfalls cascade into the ocean. Cultural encounter with the Bagyeli community.' },
        { day: 3, title: 'Lighthouse & Return', details: 'Visit to Kribi historic German lighthouse, fresh fish market souvenir stop, scenic transfer back.' }
      ],
      included: ['2 Nights Beachfront Hotel', 'Breakfast & Seafood Dinner', 'Private Air-Conditioned Transport', 'Guided Tours & Park Entry Fees'],
      excluded: ['Personal Alcoholic Beverages', 'Optional Jet Ski Rental'],
      meetingPoint: 'Douala (Akwa) or Yaoundé (Bastos)'
    },
    {
      id: 'pkg-2',
      slug: 'limbe-botanic-mount-cameroon-hike',
      title: 'Limbe Botanic & Mount Cameroon Hike',
      destination: 'Limbe & Buea, South West, Cameroon',
      duration: '2 Days / 1 Night',
      durationDays: 2,
      price: 75000,
      currency: 'XAF',
      rating: 4.8,
      reviewsCount: 64,
      organizer: 'Fako Mountain Adventures',
      badge: 'NATURE & ADVENTURE',
      highlights: ['Limbe Botanical Gardens (1892)', 'Mount Cameroon Lava Flow Hike', 'Black Sand Beach Relaxation', 'Wildlife Centre Visit'],
      itinerary: [
        { day: 1, title: 'Limbe Coast & Botanic Heritage', details: 'Departure from Douala, guided tour of Limbe Botanic Garden, Limbe Wildlife Centre primate sanctuary, evening at Down Beach.' },
        { day: 2, title: 'Mount Cameroon Slope Hike', details: 'Scenic morning hike to the 1999 lava flow in Bakingili with a certified mountain ranger, fresh roast fish lunch, afternoon return.' }
      ],
      included: ['1 Night Coastal Lodge', 'All Meals & Mineral Water', 'Licensed Mountain Ranger', 'Transport from Douala'],
      excluded: ['Mountain Climbing Boots (Available for Rent)', 'Tips']
    },
    {
      id: 'pkg-3',
      slug: 'rhumsiki-kapsiki-cultural-peaks',
      title: 'Rhumsiki Cultural Peaks & Mandara Mountains',
      destination: 'Far North Region, Cameroon',
      duration: '4 Days / 3 Nights',
      durationDays: 4,
      price: 260000,
      currency: 'XAF',
      rating: 4.9,
      reviewsCount: 42,
      organizer: 'Sahel Eco-Tours',
      badge: 'CULTURAL EXPEDITION',
      highlights: ['Volcanic Plug Landscapes', 'Crab Sorcerer Consultation', 'Artisanal Weavers of Rhumsiki', 'Gorges de Kola Stop'],
      itinerary: [
        { day: 1, title: 'Flight to Maroua & Kola Gorges', details: 'Flight arrival in Maroua, transfer to Gorges de Kola monumental rocks, check-in at Campement de Rhumsiki.' },
        { day: 2, title: 'Rhumsiki Needle & Traditional Crafts', details: 'Sunrise hike around the volcanic plug, consultation with the traditional crab sorcerer, brass-smiths workshop.' },
        { day: 3, title: 'Kapsiki Villages & Mandara Trek', details: 'Gentle hiking through terrace farming landscapes and ancestral stone compounds.' },
        { day: 4, title: 'Maroua Artisan Market & Return', details: 'Maroua leathercraft and embroidery market, transfer to Maroua Salak Airport.' }
      ],
      included: ['3 Nights Campement / Hotel', 'All Regional 4x4 Transport', 'Local English/French Guide', 'All Meals'],
      excluded: ['Domestic Flights (Can be bundled)']
    }
  ],

  // 7. Visa & Consular Concierge
  visaDestinations: [
    {
      id: 'visa-fr',
      country: 'France / Schengen Area',
      flag: '🇫🇷',
      types: ['Short-stay Tourism (Type C)', 'Business Visa', 'Long-stay Student (VLS-TS)'],
      officialFee: 52500, // ~80 EUR
      conciergeFee: 25000,
      totalEstimatedFee: 77500,
      currency: 'XAF',
      processingDays: '15 to 21 working days',
      requirements: [
        'Valid Passport (at least 6 months validity from return date)',
        '3 Recent Bank Statements (Certified by local bank)',
        'Proof of Accommodation / Hotel Booking or Attestation d’accueil',
        'Roundtrip Flight Reservation (Provided by LOUMOO)',
        'Compliant Travel & Medical Insurance (€30,000 coverage)',
        'Employment Letter or Business Registration (RCCM)'
      ],
      appointmentCenter: 'TLScontact Douala / Yaoundé'
    },
    {
      id: 'visa-usa',
      country: 'United States of America',
      flag: '🇺🇸',
      types: ['B1/B2 Visitor & Tourism', 'F1 Academic Student', 'C1/D Transit & Crew'],
      officialFee: 115000, // $185 MRV fee
      conciergeFee: 35000,
      totalEstimatedFee: 150000,
      currency: 'XAF',
      processingDays: 'Appointment-dependent + 3-5 days after interview',
      requirements: [
        'DS-160 Confirmation Page & Barcode',
        'Valid Passport with at least 2 blank pages',
        '5x5 cm Color Photo (White background)',
        'Proof of Financial Solvency & Ties to Cameroon',
        'Purpose of Travel Letter'
      ],
      appointmentCenter: 'US Embassy Yaoundé (Rosa Parks Avenue)'
    },
    {
      id: 'visa-uae',
      country: 'United Arab Emirates (Dubai)',
      flag: '🇦🇪',
      types: ['30 Days Single Entry', '60 Days Tourist', '96 Hours Transit'],
      officialFee: 65000,
      conciergeFee: 20000,
      totalEstimatedFee: 85000,
      currency: 'XAF',
      processingDays: '3 to 5 working days (E-Visa)',
      requirements: [
        'Clear Passport Bio Page Scan',
        'Passport Photo (White background)',
        'Confirmed Return Flight Ticket',
        'Hotel Booking Confirmation'
      ],
      appointmentCenter: '100% Digital E-Visa (No Embassy Visit Required)'
    },
    {
      id: 'visa-ca',
      country: 'Canada',
      flag: '🇨🇦',
      types: ['Visitor Visa (TRV)', 'Study Permit', 'Super Visa for Parents'],
      officialFee: 75000, // 100 CAD + 85 CAD biometrics
      conciergeFee: 35000,
      totalEstimatedFee: 110000,
      currency: 'XAF',
      processingDays: '30 to 60 working days',
      requirements: [
        'Valid Passport',
        'Biometrics at VFS Global Yaoundé',
        'Bank Statements (Past 4 months)',
        'Letter of Explanation / Purpose of Travel',
        'Proof of Ties (Property, Employment, Family)'
      ],
      appointmentCenter: 'VFS Global Yaoundé'
    }
  ]
};

module.exports = travelData;
