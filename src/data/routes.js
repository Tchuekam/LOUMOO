/**
 * LOUMOO SCREEN ROUTES & NAVIGATION MAPPING
 */
export const routes = {
  // Main Hubs
  home: { title: 'Home', section: 'commerce' },
  category: { title: 'Category', section: 'commerce' },
  bestpicks: { title: 'Best Picks', section: 'commerce' },
  freeday: { title: 'Black FreeDay', section: 'commerce' },
  product: { title: 'Product Details', section: 'commerce' },
  sellers: { title: 'Compare Sellers', section: 'commerce' },
  
  // Search & Discovery
  search: { title: 'Search', section: 'discovery' },
  filters: { title: 'Filter Options', section: 'discovery' },
  voice: { title: 'Voice Search', section: 'discovery' },
  visual: { title: 'Visual Camera Search', section: 'discovery' },
  visualScan: { title: 'Scanning Object', section: 'discovery' },
  visualResults: { title: 'Visual Matches', section: 'discovery' },
  
  // Communication & Assistant
  chat: { title: 'Discussions', section: 'communication' },
  threadAi: { title: 'AI Assistant', section: 'communication' },
  threadSeller: { title: 'Seller Chat', section: 'communication' },
  notifications: { title: 'Notifications', section: 'communication' },

  // Commerce, Cart & Checkout
  cart: { title: 'Shopping Cart', section: 'checkout' },
  checkout: { title: 'Secure Checkout', section: 'checkout' },
  paying: { title: 'Processing Payment', section: 'checkout' },
  success: { title: 'Order Confirmed', section: 'checkout' },
  orders: { title: 'My Orders', section: 'checkout' },

  // Store & Merchant
  store: { title: 'Store Directory', section: 'store' },
  business: { title: 'Business Profile', section: 'store' },
  seller: { title: 'Seller Studio', section: 'store' },
  myListings: { title: 'My Listings', section: 'store' },
  
  // Listing Upload Flow
  upload: { title: 'Sell on LOUMOO', section: 'upload' },
  uploadDetails: { title: 'Listing Details', section: 'upload' },
  uploadPrice: { title: 'Set Price & Shipping', section: 'upload' },
  uploadSuccess: { title: 'Listing Published', section: 'upload' },

  // Travel Hub
  travel: { title: 'Travel & Flights', section: 'travel' },
  travelBus: { title: 'Intercity Bus Booking', section: 'travel' },
  travelPackages: { title: 'Tourism Packages', section: 'travel' },
  travelVisa: { title: 'Visa Assistance', section: 'travel' },
  travelResults: { title: 'Flight Results', section: 'travel' },
  travelDetail: { title: 'Flight Details', section: 'travel' },
  travelPassenger: { title: 'Passenger Details', section: 'travel' },
  travelTicket: { title: 'E-Ticket & Boarding Pass', section: 'travel' },

  // Community & Classifieds
  announce: { title: 'Announcements & Jobs', section: 'community' },
  announceDetail: { title: 'Announcement Details', section: 'community' },

  // Comparison & Saved
  vs: { title: 'Compare Setup', section: 'tools' },
  vsCompare: { title: 'Side-by-Side Matrix', section: 'tools' },
  saved: { title: 'Saved Items', section: 'tools' },
  transactions: { title: 'Transactions Ledger', section: 'tools' },
  settings: { title: 'Settings', section: 'profile' },
  profile: { title: 'User Profile', section: 'profile' }
};

export const NO_NAV_SCREENS = [
  'filters', 'voice', 'visual', 'visualScan', 'visualResults',
  'threadAi', 'threadSeller', 'checkout', 'paying', 'success',
  'upload', 'uploadDetails', 'uploadPrice', 'uploadSuccess',
  'travelPassenger', 'travelTicket'
];
