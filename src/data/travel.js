/**
 * LOUMOO TRAVEL & BOOKING DATASET
 */
export const travelOptions = {
  flights: [
    {
      id: 'fl-1',
      airline: 'Camair-Co',
      route: 'DLA → NSI (Yaoundé)',
      time: '08:30 – 09:15',
      duration: '45m',
      price: 'XAF 48 500',
      stops: 'Direct',
      baggage: '23 kg included'
    },
    {
      id: 'fl-2',
      airline: 'Air France',
      route: 'DLA → CDG (Paris)',
      time: '23:45 – 06:50 (+1)',
      duration: '6h 05m',
      price: 'XAF 485 000',
      stops: 'Direct',
      baggage: '2x 23 kg'
    },
    {
      id: 'fl-3',
      airline: 'Brussels Airlines',
      route: 'DLA → BRU (Brussels)',
      time: '22:15 – 06:10 (+1)',
      duration: '6h 55m',
      price: 'XAF 440 000',
      stops: 'Direct',
      baggage: '2x 23 kg'
    }
  ],
  busLines: [
    {
      id: 'bus-1',
      agency: 'General Express Voyages',
      route: 'Douala (Bépanda) → Yaoundé (Mvan)',
      departure: '06:00',
      arrival: '10:00',
      type: 'VIP Air-Conditioned',
      price: 'XAF 6 000'
    },
    {
      id: 'bus-2',
      agency: 'Touristique Express',
      route: 'Douala → Ngaoundéré',
      departure: '12:00',
      arrival: '06:00 (+1)',
      type: 'Prestige Sleeper',
      price: 'XAF 18 000'
    }
  ],
  packages: [
    {
      id: 'pkg-1',
      title: 'Kribi Beach & Lobé Falls Weekend',
      duration: '3 Days / 2 Nights',
      price: 'XAF 120 000 / person',
      includes: 'Hotel + Breakfast + Guided Tour'
    },
    {
      id: 'pkg-2',
      title: 'Limbe Botanic & Mount Cameroon Hike',
      duration: '2 Days / 1 Night',
      price: 'XAF 75 000 / person',
      includes: 'Transport + Guide + Park Fees'
    }
  ]
};
