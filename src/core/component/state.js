// @fragment state core — initial state entries owned by the core domain (assembled into Component by src/core/build/component.py)
({
    screen: 'home', stack: [], cart: 0, cartItems: [], orders: [], lastOrder: null, vs: 2, toast: '', following: false, saved: false,
    sidebarCollapsed: true,
    vsFilterMode: 'all',
    vsPriority: 'perf',
    vsResult: null,
    vsResultLoading: false,
    vsCompareIds: ['elec-1', 'elec-macbook-pro'],
    vsPickerQuery: '',
    vsPickerCat: 'all',
    vsSlot1Active: true,
    vsSlot2Active: true,
    vsSlot3Active: false,
    vsSlot4Active: false,
    vsSecPerfOpen: true,
    vsSecDispOpen: true,
    vsSecBattOpen: true,
    vsSecBuildOpen: true,
    vsSecPortsOpen: true,
    vsSecCommOpen: true,
    heroSlide: 0,
    activeVideoModal: null,
    productWishlist: {},
    infiniteFeedBatch: 1,
    qty: 1, freeday: false, darkMode: false,
    isLoggedIn: false,
    // Authoritative session state resolved from GET /api/v1/me/state.
    // 'unknown' during boot so the Get Started CTA never flashes for a
    // signed-in user; resolves to 'authenticated' | 'anonymous'.
    authStatus: 'unknown',
    sessionUser: null,

    // The server's account-state envelope. This is a PROJECTION of the
    // server's decision — the UI renders it, and never writes to it to grant
    // itself a permission.
    accountState: null,        // 'ACCOUNT_READY', 'SELLER_READY', ...
    capabilities: {},          // { canCreateListing: bool, ... }
    serverOnboarding: null,    // { nextStep, steps, percentage, draft }
    authProviderStatus: 'loading',  // loading | ready | unavailable
    authProviderError: '',
    onboardingBusy: false,
    onboardingError: '',
    onboardingFieldErrors: {},

    // Registration (real Clerk account creation)
    regPassword: '',
    regShowPassword: false,
    regBusy: false,
    regError: '',

    // Reported by the server: whether a phone verification provider exists.
    phoneVerificationAvailable: false,

    // ── Phase A: Sign In ──
    signInIdentifier: '',
    signInPassword: '',
    signInShowPassword: false,
    signInBusy: false,
    signInError: '',
    // Screen to land on after a successful sign in. Only ever set to a key
    // that exists in SCREENS (validated in requireAuth) — never a raw string
    // from user input or a URL, so it cannot be used as an open redirect.
    postAuthRedirect: '',

    // ── Phase A: Password reset ──
    resetEmail: '',
    resetCode: '',
    resetNewPassword: '',
    resetConfirmPassword: '',
    resetShowPassword: false,
    resetBusy: false,
    resetError: '',
    resetRequestSent: false,
    resetServerMessage: '',
    resetCooldown: 0,

    // ── Phase A: Email verification ──
    emailVerifyState: 'pending',
    emailVerifyCode: '',
    emailVerifyError: '',
    emailVerifyCooldown: 0,

    // ── Phase 4: SuperAdmin Dashboard State ──
    adminActiveTab: 'overview',
    adminStats: {
      gmvXaf: 14850000,
      gmvFormatted: '14 850 000 XAF',
      totalOrders: 86,
      activeStores: 18,
      pendingKycCount: 3,
      registeredUsers: 142,
      escrowInFlightXaf: 2340000,
      escrowInFlightFormatted: '2 340 000 XAF',
      disputeCount: 2
    },
    adminStoresList: [
      { id: 'store_orca_1', name: 'Orca Electronics', category: 'Électronique & High-Tech', city: 'Douala', phone_number: '237677101234', status: 'ACTIVE', verification_tier: 'pro_merchant', is_verified: true, owner: { full_name: 'Jean-Paul Mbarga', kyc_status: 'verified' } },
      { id: 'store_kamer_2', name: 'Kamer Tech Solutions', category: 'Informatique & Réseaux', city: 'Yaoundé', phone_number: '237677814455', status: 'PENDING_VERIFICATION', verification_tier: 'unverified', is_verified: false, owner: { full_name: 'Alain Fotso', kyc_status: 'pending' } },
      { id: 'store_milano_3', name: 'Armonía Milano Boutique', category: 'Mode & Luxe Italien', city: 'Douala', phone_number: '237655907755', status: 'ACTIVE', verification_tier: 'official_brand', is_verified: true, owner: { full_name: 'Clarisse Eboué', kyc_status: 'verified' } },
      { id: 'store_sahel_4', name: 'Sahel Leather Works', category: 'Maroquinerie Artisanale', city: 'Maroua', phone_number: '237655411099', status: 'PENDING_VERIFICATION', verification_tier: 'unverified', is_verified: false, owner: { full_name: 'Ousmane Bouba', kyc_status: 'pending' } }
    ],
    adminStoreFilter: 'ALL',
    adminListingsList: [
      { id: 'lst_macbook_1', title: 'MacBook Pro 16" M3 Max 36GB/1TB', base_price: '2 450 000', currency: 'XAF', store_name: 'Orca Electronics', category_id: 'ÉLECTRONIQUE', stock_quantity: 4, status: 'ACTIVE', is_featured: true },
      { id: 'lst_insta_2', title: 'Insta360 X4 8K 360° Action Cam', base_price: '485 000', currency: 'XAF', store_name: 'Orca Electronics', category_id: 'CAMÉRAS 360°', stock_quantity: 12, status: 'ACTIVE', is_featured: true },
      { id: 'lst_bag_3', title: 'Sac Weekend Cuir Pleine Fleur Sahel Gold', base_price: '185 000', currency: 'XAF', store_name: 'Sahel Leather Works', category_id: 'LUXE & MODE', stock_quantity: 2, status: 'ACTIVE', is_featured: false },
      { id: 'lst_ps5_4', title: 'Console PlayStation 5 Slim Édition 1To', base_price: '420 000', currency: 'XAF', store_name: 'Kamer Tech Solutions', category_id: 'JEUX VIDÉO', stock_quantity: 7, status: 'PENDING', is_featured: false }
    ],
    adminUsersList: [
      { id: 'usr_admin', full_name: 'Super Administrateur LOUMOO', email: 'admin@loumoo.cm', phone_number: '237690000000', primary_role: 'super_admin', kyc_status: 'verified', city: 'Douala' },
      { id: 'usr_merchant_1', full_name: 'Jean-Paul Mbarga (Orca)', email: 'jeanpaul.mbarga@orca.cm', phone_number: '237677101234', primary_role: 'seller', kyc_status: 'verified', city: 'Douala' },
      { id: 'usr_buyer_1', full_name: 'Martine Ngo Yomkil', email: 'martine.ngo@gmail.com', phone_number: '237699112233', primary_role: 'customer', kyc_status: 'unverified', city: 'Yaoundé' }
    ],
    adminOrdersList: [
      { id: 'ord_1001', order_number: 'LM-2609-8472', customer_name: 'Martine Ngo Yomkil', store_name: 'Orca Electronics', total_amount: '2 450 000', currency: 'XAF', status: 'DELIVERED', escrow_status: 'HELD' },
      { id: 'ord_1002', order_number: 'LM-2609-9134', customer_name: 'Martine Ngo Yomkil', store_name: 'Armonía Milano Boutique', total_amount: '185 000', currency: 'XAF', status: 'PROCESSING', escrow_status: 'HELD' }
    ],
    adminSettings: {
      platform_commission_rate: { rate_percent: 5.0 },
      seller_whatsapp_default: { number: '237690123456' },
      maintenance_mode: { enabled: false },
      announcement_banner: { enabled: true, text_fr: "Livraison express offerte dès 50 000 XAF d'achats sur LOUMOO !" }
    },
    adminAuditLogsList: [
      { id: 'aud_1', action: 'system.bootstrap', resource_type: 'platform', resource_id: 'root', admin_id: 'super_admin', reason: 'Initialisation de la console SuperAdmin', created_at: '2026-09-17 14:00:00' }
    ],
    adminSettingsSaveSuccess: false,
    systemSettings: null,
    adminActiveTab: 'overview',
    adminTabIsOverview: true,
    adminTabIsStores: false,
    adminTabIsListings: false,
    adminTabIsUsers: false,
    adminTabIsOrders: false,
    adminTabIsSettings: false,
    adminTabIsAudit: false,
    filteredAdminStoresList: null,

    userRole: 'buyer',
    regFirstName: '',
    regLastName: '',
    regAvatar: '',
    regPhone: '',
    regEmail: '',
    regCity: 'douala',
    regAddress: '',
    // Seeded with a demo merchant's name until now, which any seller
    // without their own business name displayed as their storefront.
    regBusinessName: '',
    regRccm: 'RC/DLA/2023/B/1842',
    legalForm: 'sarl',
    interestTech: true,
    interestFashion: false,
    interestTravel: true,
    interestServices: false,
    priorityVerified: true,
    priorityPrice: false,
    prioritySpeed: false,
    priorityWarranty: false,
    sellerType: 'pro',
    prodPhysical: true,
    prodDigital: false,
    prodServices: false,
    prodRentals: false,
    verificationChoice: 'now',
    docUploaded: false,
    ship: { home: true, pickup: true, nation: false },
    sel: {
      searchTab: 'all', chatTab: 'all', sellerSort: 'value', ordersTab: 'active',
      catChip: 'douala', bizTab: 'products', vmTab: 'exact', listTab: 'live',
      travelTab: 'flights', trSort: 'cheap', annChip: 'all', ftype: 'products',
      ftrust: 'verified', pvar: 'g256', pcolor: 'grey', photo: 'p1',
      pay: 'mtn', deliv: 'home', uqty: 'one'
    },

    // ── Phase B: User Account Hub State ──
    dashboard: null,
    dashboardLoading: false,
    dashboardError: '',
    profileFormFirstName: '',
    profileFormLastName: '',
    profileFormCity: 'douala',
    profileFormBusinessName: '',
    profileFormSellerType: 'pro',
    profileFormDirty: false,
    profileSaving: false,
    profileFormError: '',
    // Seeded with two of a real person's home/office addresses until now, which
    // any account with no addresses of its own displayed as its own.
    addressesList: [],
    addressesLoading: false,
    addressFormName: '',
    addressFormPhone: '',
    addressFormCity: 'douala',
    addressFormStreet: '',
    addressFormIsDefault: false,
    addressFormSaving: false,
    addressFormError: '',
    editingAddressId: null,
    notifInApp: true,
    notifEmail: true,
    notifPush: true,
    notifOrders: true,
    notifFollowed: true,
    notifPromos: false,
    notifSaving: false,
    privacyPersonalization: true,
    privacyAnalytics: true,
    privacyMarketing: false,
    privacySaving: false,
    activeSessionsList: [
      { id: 'sess_1', device: 'Apple iPhone 15 Pro Max', location: 'Douala, Cameroon', lastActive: 'Active now', isCurrent: true },
      { id: 'sess_2', device: 'MacBook Pro · Chrome', location: 'Yaoundé, Cameroon', lastActive: '2 days ago', isCurrent: false }
    ],
    sessionsLoading: false,
    followedStoresList: [
      { id: 'store_1', storeId: 'store_orca_electronics', storeName: 'Orca Electronics Douala', city: 'Douala, Akwa', productCount: 318 },
      { id: 'store_2', storeId: 'store_kribi_fresh', storeName: 'Kribi Seafood & Organic Express', city: 'Kribi, Tara', productCount: 42 }
    ],
    followedStoresLoading: false,
    activityList: [
      { id: 'act_1', title: 'Order Placed (LM-94820)', description: 'Apple iPhone 15 Pro Max 256GB with Escrow MoMo Checkout', createdAt: '28 Aug 2026, 14:32' },
      { id: 'act_2', title: 'Address Added', description: 'Immeuble CAA, Bastos, Yaoundé set as shipping location', createdAt: '25 Aug 2026, 10:15' },
      { id: 'act_3', title: 'Followed Store', description: 'Subscribed to Orca Electronics Douala flash stock notifications', createdAt: '22 Aug 2026, 18:40' }
    ],
    activityLoading: false,
    // Seller identity, mirrored from GET /me/state. The store is the source of
    // truth for every seller capability; nothing here is decided locally.
    sellerStatus: 'NONE',
    primaryStoreId: null,
    store: null,
    deleteAccountConfirmText: '',
    deleteAccountReason: 'not_using',
    deleteAccountBusy: false,
    deleteAccountError: '',

    // ── Phase D: Order, Review & Vertical State ──
    currentOrder: {
      id: 'LM-94820',
      placedAt: '28 Aug 2026',
      statusLabel: 'IN TRANSIT',
      totalFormatted: '748 000'
    },
    refundReason: 'damaged',
    refundDetails: '',
    refundPhotoAttached: false,
    refundBusy: false,
    reviewStars: 5,
    reviewRatingLabel: '5.0 EXCELLENT',
    reviewTitle: '',
    reviewBody: '',
    reviews: [],
    reviewTargetId: '',
    reviewTargetName: '',
    trips: [],
    lastTrip: null,
    notifications: [],
    travelPaxName: '',
    travelPaxPhone: '',
    travelPaxId: '',
    travelFrom: 'Douala',
    travelTo: 'Yaoundé',
    travelDate: new Date().toISOString().slice(0, 10),
    travelSearchResults: [],
    travelSearchLoading: false,
    travelSearchError: '',
    travelSearchDone: false,
    selectedTravelResult: null,
    travelLandingLoaded: false,
    travelLandingLoading: false,
    travelLandingError: '',
    travelLandingItems: [],
    payoutMethod: 'mtn',
    payoutPhone: '690 12 34 56',
    payoutAmount: '500 000',
    hotelCity: '',
    hotelSelectedId: '',
    hotelRoomIndex: 0,
    // Dates are derived from today, never hardcoded: a literal date silently
    // becomes a PAST date as time passes, and the server rejects those.
    hotelCheckIn: isoDaysFromToday(1),
    hotelCheckOut: isoDaysFromToday(4),
    hotelGuests: 2,
    hotelGuestName: 'Rostand Tchuekam',
    hotelGuestPhone: '+237 690 12 34 56',
    hotelReservation: null,

    // ── Hotel catalog, served by the backend (GET /travel/hotels) ──
    // The catalog is NOT held in the bundle: a local copy drifts from the
    // server's real inventory and prices, and lets the UI advertise rooms
    // that cannot actually be booked.
    hotelList: [],
    hotelListLoading: false,
    hotelListError: '',
    hotelListLoaded: false,
    hotelDetailData: null,
    hotelDetailLoading: false,
    hotelDetailError: '',
    hotelRooms: [],
    hotelRoomsLoading: false,
    hotelRoomsError: '',
    hotelSelectedRoomId: '',
    hotelSubmitting: false,
    hotelSubmitError: '',
    // Client-only favourite marks (hero heart); never persisted server-side.
    hotelFavIds: {},

    // ── Travel & Mobility Ecosystem State ──
    travelServiceTab: 'bus',
    travelMyTripsTab: 'upcoming',
    busOperatorFilter: 'all',
    selectedBusSeat: '4A',
    travelTripsLoading: false,
    travelTripsError: '',
    travelTickets: [],
    travelTicketsLoading: false,
    busSchedules: [
      {
        id: 'bus-sch-1',
        operatorId: 'op-general-express',
        operatorName: 'General Express Voyages',
        operatorVerified: true,
        route: 'Douala (Bépanda) → Yaoundé (Mvan)',
        origin: 'Douala',
        destination: 'Yaoundé',
        originTerminal: 'Terminal Bépanda',
        destinationTerminal: 'Terminal Mvan',
        departureTime: '06:00',
        arrivalTime: '09:45',
        duration: '3h 45m NON-STOP',
        busClass: 'VIP Prestige',
        className: 'VIP PRESTIGE',
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
        operatorName: 'Finexs Voyages VIP',
        operatorVerified: true,
        route: 'Douala (Akwa) → Yaoundé (Tongolo)',
        origin: 'Douala',
        destination: 'Yaoundé',
        originTerminal: 'Akwa Liberté',
        destinationTerminal: 'Tongolo Express',
        departureTime: '07:30',
        arrivalTime: '11:15',
        duration: '3h 45m NON-STOP',
        busClass: 'VIP Prestige',
        className: 'VIP PRESTIGE',
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
        route: 'Douala (Bessengue) → Ngaoundéré',
        origin: 'Douala',
        destination: 'Ngaoundéré',
        originTerminal: 'Bessengue VIP',
        destinationTerminal: 'Gare Grand Nord',
        departureTime: '12:00',
        arrivalTime: '06:00',
        duration: '18h OVERNIGHT',
        busClass: 'Overnight Sleeper',
        className: 'OVERNIGHT SLEEPER',
        busClassId: 'sleeper',
        price: 18000,
        currency: 'XAF',
        totalSeats: 24,
        availableSeats: 6,
        occupiedSeats: ['1A', '1B', '2A', '3B', '4A', '4B'],
        layoutType: '2x1',
        amenities: ['Wi-Fi 6', 'Full Recline Sleeper', 'AC', 'Dinner Included', 'Restroom']
      }
    ],
    busSchedulesLoading: false,
    busSchedulesError: '',
    selectedBusSchedule: null,
    activeSeatMap: null,
    activeSeatsList: [
      { seatNumber: '1A', isWindow: true, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '1B', isAisle: true, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '1C', isWindow: false, isOccupied: true, isAvailable: false, price: 6000 },
      { seatNumber: '2A', isWindow: true, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '2B', isAisle: true, isOccupied: true, isAvailable: false, price: 6000 },
      { seatNumber: '2C', isWindow: false, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '4A', isWindow: true, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '4B', isAisle: true, isOccupied: false, isAvailable: true, price: 6000 },
      { seatNumber: '4C', isWindow: false, isOccupied: false, isAvailable: true, price: 6000 }
    ],
    seatMapLoading: false,
    busOperators: [],
    travelPackages: [],
    travelPackagesLoading: false,
    travelVisaDestinations: [],
    travelPaxCount: 1,
    travelClass: 'vip',
    travelPaxClassLabel: '1 Adult · VIP',
    travelPaymentMethod: 'mtn',
    travelBookingMode: 'ticket',
    visaCountry: '',
    visaDate: '',
    visaPhone: '',
    visaApplicantName: 'ROSTAND TCHUEKAM',
    visaApplicationRef: 'LMT-VSA-91024',
    visaApplicationStatus: 'IN REVIEW',
    visaCountryLabel: 'France / Schengen Short Stay (Type C)',

    // ── Phase E: Store & Business System State ──
    createStoreName: '',
    createStoreLogoUrl: '',
    storeLogoUrl: '',
    createStoreCategory: 'electronics',
    createStoreDesc: '',
    createStoreCity: 'douala',
    createStorePhone: '',
    createStoreBusy: false,
    createStoreError: '',
    storeOnboardingPercentage: 75,
    storeVerificationStatusLabel: 'DRAFT',
    verLegalName: '',
    verBusinessType: 'individual',
    verRccm: '',
    verNiu: '',
    verDocAttached: false,
    analyticsPeriod: '30d',
    analyticsRevenueFormatted: '0 XAF',
    analyticsOrdersCount: 0,
    analyticsViewsCount: '0',
    analyticsUniqueVisitors: '0',
    analyticsConversionRate: '0.0',
    analyticsTopProducts: [],

    // ── LOUMOO Announce: Zero Telemetry for New Stores ──
    announcePeriod: '7d',
    announceCampaigns: [],
    announceTotalReach: '0',
    announceUniqueViewers: '0',
    announceUniqueRatio: '0.0%',
    announceActionClicks: '0',
    announceAverageCtr: '0.00%',
    announceWhatsappInquiries: '0',
    announcePipelineValue: '0 XAF',
    announceActiveCampaignsCount: 0,
    announceCampaignsCountLabel: '0 Active Broadcasts',
    announceHasCampaigns: false,
    announceTelemetryLoading: false,
    announceDoualaReach: '0%',
    announceYaoundeReach: '0%',
    announceRegionalReach: '0%',
    storeTagline: '',
    storeName: '',
    storeDescription: '',
    storeBio: '',
    storeReturnPolicy: '',
    storeWarrantyPolicy: '',
    storeShippingPolicy: '',
    storeOpenStatusBadge: 'OPEN',
    storeOpenTime: '08:00',
    storeCloseTime: '18:30',
    storeLocationStreet: '',
    storeLocationLandmark: '',

    // ── Stores & Brands Discovery / Storefront State ──
    storeSearchQuery: '',
    storeCityFilter: 'all',
    storeCategoryFilter: 'all',
    storeVerifiedOnly: false,
    storeActiveTab: 'home',
    selectedBrand: 'apple',
    brandFollowed: false,

    // ── All Categories & Taxonomy Discovery State ──
    categorySearchQuery: '',
    categorySelectedDomain: 'all',
    activeCategorySlug: 'all',
    activeSubcategorySlug: 'all',
    categorySortBy: 'popular',
    categoryCityFilter: 'all',
    categoryVerifiedOnly: false,

    // ── Search & Filter State ──
    // searchResults: null  = no query executed yet (show default/popular state)
    //                 []    = a search ran and returned zero matches (empty state)
    //                 [...] = matches to render
    searchQuery: '',
    searchResults: null,
    searchBusy: false,
    searchError: '',
    // Marketplace refinement filters (feed the same /products query as search).
    filterCity: '',            // '' = all cities; else 'douala' | 'yaounde' | 'kribi'
    filterVerifiedOnly: false, // true = only verified/official stores

    // ── Phase F: Universal Publishing Engine ──
    // ONE draft object drives the whole studio (src/services/publishingEngine.js).
    // The previous revision kept nineteen loose `newListing*` / `attr*` keys
    // seeded with a demo MacBook, which is why an untouched wizard already had
    // someone else's product in it — and why every publish attempt sent
    // electronics attributes to whatever category was chosen.
    pubDraft: null,
    pubSectionKey: null,
    pubAdvancedOpen: false,
    pubPreviewOpen: false,
    pubPreviewDevice: 'mobile',
    pubChipDrafts: {},

    // Server-resolved definitions. Fetched once, then cached per category.
    pubTaxonomy: [],
    pubCategorySchema: null,
    pubCategorySchemaId: null,
    pubBroadcastSchema: null,
    pubAttachable: [],

    // Lifecycle: '' | 'VALIDATING' | 'UPLOADING' | 'SAVING' | 'PUBLISHING'
    pubLifecycle: '',
    pubBusyLabel: '',
    pubServerError: '',
    pubRetryable: false,
    pubFieldErrors: {},
    pubMediaError: '',
    pubMediaBusy: false,
    pubSaveState: 'Not saved yet',
    pubOffline: false,
    pubResumable: null,
    pubPublished: null,
    pubRevealErrors: false,

    // ── Discovery surfaces fed by what the studio publishes ──
    announcements: [],
    announceTotal: 0,
    announceLoading: false,
    announceError: '',
    announceFilter: 'all',
    announceSearch: '',
    activeAnnouncementId: null,
    activeAnnouncement: null,
    announceDetailLoading: false,
    sellerListings: [],
    sellerTabCounts: {},
    sellerListingTab: 'all',
    sellerListingsLoading: false,
    sellerListingsError: '',
    storeDiscovery: [],
    storeDiscoveryTotal: 0,
    storeDiscoveryLoading: false,
    storeDiscoveryError: '',

    // ── Canonical Dynamic Product & Catalog State ──
    currentProductId: null,
    currentProduct: null,
    productLoading: false,
    productNotFound: false,
    productError: '',
    currentProductActiveImage: null,
    catalogProducts: [],
    catalogLoading: false,
    catalogError: '',
    catalogPage: 1,
    catalogHasMore: true,
    categoryFeedLimit: 24,
    homeFeedLimit: 24
})
