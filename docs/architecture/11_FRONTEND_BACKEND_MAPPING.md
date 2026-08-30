# LOUMOO — Complete Frontend-to-Backend Traceability Matrix (All 58 Screens)

## 1. Exhaustive Screen-by-Screen Architectural Mapping

This matrix maps every single screen, user interaction, reactive state mutation, and business flow present in the LOUMOO frontend to its exact backend domain, database tables, REST/WebSocket API endpoints, authorization rules, domain events, and third-party integrations.

---

### Module A: Discovery, Home & Search (Screens 1 – 7)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `is.home` | **Marketplace Hub**: View promotional banners, flash deals, categories, hotels, tech deals, universities, and services. | Catalog Service, Promotion Engine | `catalog.products`, `catalog.categories`, `sellers.profiles` | `GET /v1/catalog/home-feed` | Public | None (Read) | Cloudflare CDN |
| **2** | `is.search` | **Search Bar & Tabs**: Search queries across all, products, stores, services, travel with recent search memory. | Search Service | `catalog.products`, `sellers.profiles`, `iam.search_history` | `GET /v1/search?q={query}&tab={tab}` | Public / User ID for history | None | Meilisearch Cluster |
| **3** | `is.filters` | **Faceted Filters Modal**: Select city chips (Douala, Yaoundé, Kribi), price sliders, trust badges (Verified, Escrow). | Search & Discovery Service | `catalog.products`, `catalog.categories` | `GET /v1/search?q={}&facets={}` | Public | None | Meilisearch |
| **4** | `is.voice` | **Voice Search**: Record speech waveform audio and convert query into text search. | AI Speech Gateway | `iam.search_history` | `POST /v1/ai/voice-transcribe` | Public | None | Google Cloud Speech-to-Text |
| **5** | `is.visual` | **Camera Viewfinder**: Real-time camera viewfinder to photograph product for visual matching. | Storage & Media Gateway | S3 Temp Bucket | `POST /v1/storage/upload-url` (Type: visual) | Public | None | S3 Object Storage |
| **6** | `is.visualScan`| **AI Scanner Animation**: View image scan pulse while neural net analyzes bounding boxes. | AI Vision Service | None (In-memory buffer) | `POST /v1/search/visual-embeddings` | Public | `search.visual.scanned` | TensorFlow / CLIP model |
| **7** | `is.visualResults`| **Visual Match Results**: View exact vs similar matching products across marketplace. | Search Service | `catalog.products` | `GET /v1/search/visual-results?hash={}` | Public | None | Meilisearch Vector Search |

---

### Module B: Discussions, Messaging & AI (Screens 8 – 11)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **8** | `is.chat` | **WhatsApp Discussions Hub**: Filter thread list (All, Buying, Selling, Support) with unread counters. | Messaging Service | `messaging.conversations`, `messaging.messages` | `GET /v1/conversations` | Bearer Token | None | Redis Pub/Sub |
| **9** | `is.threadSeller`| **Merchant Chat (Mr Toukam)**: Send text, contact cards, voice notes with waveform player; link preview. | Messaging Service, Audio Worker | `messaging.messages`, `messaging.conversations` | `POST /v1/conversations/:id/messages`<br/>`WS /v1/ws/chat` | Bearer Token | `messaging.message.sent.v1` | S3 Audio Bucket, WhatsApp Cloud API |
| **10**| `is.threadAi` | **TchueKAM AI Concierge**: Chat with AI assistant, get budget recommendations with real catalog links. | AI Concierge Service, Catalog RAG | `iam.users`, `catalog.products` | `POST /v1/ai/chat`<br/>`WS /v1/ws/ai` | Bearer Token | `ai.query.executed` | Google Gemini 1.5 Flash via Vertex AI |
| **11**| `is.notifications`| **Notifications Feed**: View order dispatch alerts, price drop notices, and FreeDay deals. | Notification Service | `iam.notifications` | `GET /v1/notifications` | Bearer Token | `notification.read` | Firebase Cloud Messaging (FCM) |

---

### Module C: Profile, Settings & System Fallbacks (Screens 12 – 16)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **12**| `is.profile` | **My Account Portal**: View 85% profile meter, verified badges, quick tiles (Orders, Saved, Settings), Onboarding banner. | IAM & User Service | `iam.users`, `sellers.profiles`, `onboarding.sessions` | `GET /v1/me` | Bearer Token | None | S3 Avatars |
| **13**| `is.saved` | **Saved Items & Wishlist**: View saved products, stock alerts, remove items from list. | Wishlist Service | `commerce.wishlists`, `catalog.products` | `GET /v1/me/wishlist`<br/>`DELETE /v1/me/wishlist/:id` | Bearer Token | `wishlist.item.removed` | None |
| **14**| `is.settings`| **App Settings**: Toggle dark mode, update language, change password, trigger sign out. | IAM Service | `iam.users`, `iam.sessions` | `PATCH /v1/me/settings`<br/>`POST /v1/auth/logout` | Bearer Token | `iam.user.logged_out.v1` | Redis Session Revocation |
| **15**| `is.networkError`| **Network Offline State**: Display retry connection button when client detects lost socket/HTTP. | Network Gateway | None | `GET /v1/healthz` | Public | None | None |
| **16**| `is.loading` | **Skeleton Loading State**: Display shimmer loaders while data loads asynchronously. | Client UI | None | None | Public | None | None |

---

### Module D: Adaptive Onboarding & KYC Wizard (Screens 17 – 26)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **17**| `is.onboardWelcome`| **Onboarding Welcome**: View value propositions (Escrow, Storefront, Tracking) and click Get Started. | Onboarding Service | `onboarding.sessions` | `POST /v1/onboarding/start` | Public / Pre-auth | `onboarding.started` | None |
| **18**| `is.onboardType` | **Account Intent**: Choose intent (Buyer, Seller, or Both) with tactile role selection. | Onboarding Service | `onboarding.sessions` | `PATCH /v1/onboarding/step` | Onboarding Token | `onboarding.intent.set` | None |
| **19**| `is.onboardIdentity`| **Basic Identity**: Enter First Name, Last Name, Phone (+237), Email, and City picker. | IAM / Onboarding Service | `iam.users`, `onboarding.sessions` | `PATCH /v1/onboarding/step` | Onboarding Token | `iam.identity.entered` | None |
| **20**| `is.onboardOtp` | **Phone OTP Verification**: Enter 6-digit verification code, view 48s resend timer, change phone. | Auth Service | `iam.otp_codes`, `iam.users` | `POST /v1/auth/otp/verify`<br/>`POST /v1/auth/otp/send` | Public | `iam.phone.verified.v1` | Twilio / Orange SMS Gateway |
| **21**| `is.onboardBuyer`| **Buyer Personalization**: Select category interests (Tech, Fashion, Travel) and shopping priorities. | Onboarding Service | `onboarding.sessions`, `iam.user_preferences` | `PATCH /v1/onboarding/step` | Onboarding Token | `buyer.preferences.saved` | None |
| **22**| `is.onboardSeller`| **Seller Classification**: Select seller type (Individual, Pro Boutique, Service) and catalog volume tier. | Onboarding Service | `onboarding.sessions` | `PATCH /v1/onboarding/step` | Onboarding Token | `seller.type.selected` | None |
| **23**| `is.onboardBusiness`| **Business Legal Profile**: Enter Legal entity (SARL, SA), Store Name, Tax NIU, RCCM, Physical address. | Onboarding Service, Seller Service | `onboarding.sessions`, `sellers.profiles` | `PATCH /v1/onboarding/step` | Onboarding Token | `seller.business.profiled` | None |
| **24**| `is.onboardVerify`| **Trust Document Upload**: Upload CNI/Passport and RCCM photos with live thumbnail status. | Trust & KYC Hub, Storage Service | `sellers.verification_documents` | `POST /v1/storage/upload-url`<br/>`POST /v1/sellers/verification-docs`| Onboarding Token | `kyc.document.uploaded.v1` | Encrypted Private S3 Bucket |
| **25**| `is.onboardReview`| **Summary Review**: Inspect complete registration summary grouped by identity, role, and storefront. | Onboarding Service | `onboarding.sessions` | `GET /v1/onboarding/review` | Onboarding Token | None | None |
| **26**| `is.onboardSuccess`| **Celebration & Next Actions**: Display 85% completion meter, CTA to marketplace or Seller Studio. | Onboarding Service, IAM Service | `iam.users`, `iam.sessions` | `POST /v1/onboarding/finalize` | Onboarding Token | `onboarding.completed.v1` | WhatsApp Welcome Message |

---

### Module E: Product PDP, Multi-Sellers, Cart & Checkout (Screens 27 – 35)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **27**| `is.product` | **Apple-Grade PDP**: 6-photo carousel, specs table, color/storage variants, quantity stepper, add to bag. | Catalog Service, Inventory Service | `catalog.products`, `catalog.product_variants`, `catalog.product_media` | `GET /v1/products/:idOrSlug` | Public | `product.viewed` | Cloudflare CDN |
| **28**| `is.sellers` | **Multi-Seller Directory**: Compare multiple merchants selling same SKU with prices, ratings, delivery. | Catalog & Pricing Service | `catalog.products`, `sellers.profiles` | `GET /v1/products/:id/sellers` | Public | None | None |
| **29**| `is.cart` | **Shopping Bag**: Multi-seller item grouping, line totals, delivery method toggles (Home/Pickup/Nationwide). | Cart & Pricing Service | `commerce.carts`, `commerce.cart_items` | `GET /v1/cart`<br/>`PATCH /v1/cart/items/:id` | Session / Bearer | `cart.updated.v1` | None |
| **30**| `is.checkout`| **Checkout Screen**: Address input, delivery notes, payment method selection (MoMo, OM, Card), escrow notice. | Commerce & Pricing Engine | `commerce.orders`, `commerce.order_items` | `POST /v1/checkout/intent` | Bearer Token | `order.created.v1` | PostGIS Delivery Zone Validator |
| **31**| `is.paying` | **Radar Pulse Animation**: Radar animation waiting for Mobile Money USSD prompt approval. | Payment Gateway Service | `ledger.journal_entries`, `commerce.orders` | `GET /v1/payments/status/:ref` | Bearer Token | None | MTN MoMo / Orange Money Polling |
| **32**| `is.success` | **Order Success Celebration**: View Order #KM-884920, delivery estimate, WhatsApp invoice link, track order. | Order & Notification Service | `commerce.orders` | `GET /v1/orders/:orderNumber` | Bearer Token | `order.confirmed.v1` | WhatsApp Cloud API (Invoice PDF) |
| **33**| `is.payFailed`| **Payment Failed Recovery**: Error state with retry button and alternative payment method switcher. | Payment Gateway Service | `commerce.orders` | `POST /v1/checkout/retry-payment` | Bearer Token | `payment.failed.v1` | Telco Gateway |
| **34**| `is.orders` | **Orders History**: Filter orders by tab (Active, Delivered, Travel, Refunds), view timeline status. | Order Management Service | `commerce.orders`, `commerce.order_items` | `GET /v1/orders?tab={active/delivered}` | Bearer Token | None | Logistics Carrier API |
| **35**| `is.transactions`| **Transaction Ledger**: View payment records, MoMo transaction references, and escrow release dates. | Financial Ledger Service | `ledger.journal_entries`, `ledger.entry_lines` | `GET /v1/me/transactions` | Bearer Token | None | Bank / Telco Statement Sync |

---

### Module F: Collections, Storefronts, Seller Studio & Upload (Screens 36 – 46)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **36**| `is.category`| **All Categories Hub**: Explore taxonomy cards with subcategories and active product counts. | Catalog Service | `catalog.categories` | `GET /v1/categories` | Public | None | Meilisearch |
| **37**| `is.bestpicks`| **Curated Best Picks**: View editorial staff picks, trending deals, and high-conversion products. | Recommendation Service | `catalog.products` | `GET /v1/catalog/collections/best-picks`| Public | None | Redis Cache |
| **38**| `is.freeday` | **Black FreeDay Promotions**: View countdown timer, steep discount deals, and claim deal button. | Promotion & Campaign Service | `catalog.products` | `GET /v1/promotions/freeday` | Public | `promotion.viewed` | Redis High-Speed Cache |
| **39**| `is.store` | **Merchant Storefront**: Orca Electronics brand banner, seller badge, followers count, catalog grid. | Seller Storefront Service | `sellers.profiles`, `catalog.products` | `GET /v1/stores/:slug` | Public | `store.visited` | Cloudflare CDN |
| **40**| `is.business`| **Official Business Profile**: Verified business hours, RCCM/NIU registration, physical address map. | Seller Profile Service | `sellers.profiles` | `GET /v1/stores/:slug/business-info` | Public | None | Google Maps Geocoding |
| **41**| `is.seller` | **Seller Studio Dashboard**: Revenue metrics (XAF), active listings, pending orders, fulfillment queue. | Seller Analytics Service | `commerce.orders`, `catalog.products`, `ledger.accounts` | `GET /v1/seller/dashboard` | Verified Seller | None | Aggregation Worker |
| **42**| `is.upload` | **Upload Wizard Step 1**: Choose listing category, title, condition (New, Refurbished, Used). | Listing Service | `catalog.categories` | `POST /v1/seller/listings/draft` | Verified Seller | `listing.draft.created` | None |
| **43**| `is.uploadDetails`| **Upload Wizard Step 2**: Enter technical specs, descriptions, tags, upload 6 high-res photos. | Listing & Media Service | `catalog.product_media`, `catalog.products` | `PATCH /v1/seller/listings/:id/details` | Verified Seller | `listing.media.uploaded` | Presigned S3 Upload Pipeline |
| **44**| `is.uploadPrice`| **Upload Wizard Step 3**: Set price in XAF, stock quantity, delivery options, toggle Black FreeDay. | Listing & Pricing Service | `catalog.products`, `catalog.product_variants` | `PATCH /v1/seller/listings/:id/pricing` | Verified Seller | `listing.price.set` | None |
| **45**| `is.uploadSuccess`| **Listing Published**: View listing live link, share to WhatsApp, manage inventory CTA. | Listing & Search Service | `catalog.products` | `POST /v1/seller/listings/:id/publish` | Verified Seller | `catalog.product.published.v1` | Meilisearch Indexer, WhatsApp Share |
| **46**| `is.myListings`| **My Listings Inventory**: Filter listings (Live, Drafts, Sold, Paused), edit price, restock inventory. | Inventory Management Service | `catalog.products`, `catalog.product_variants` | `GET /v1/seller/listings?status={}` | Verified Seller | `inventory.restocked` | Meilisearch Sync |

---

### Module G: Community, Comparison & Travel (Screens 47 – 58)

| # | Screen Key | Frontend Capability & User Action | Backend Domain & Service | Database Entities | API Endpoint | Auth Policy | Emitted Domain Events | External Integrations |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **47**| `is.announce`| **Announcements Hub**: Filter posts (Services, Offers, Jobs, Events, Tenders) with Post button. | Community Service | `community.announcements` | `GET /v1/announcements?category={}` | Public | None | Meilisearch |
| **48**| `is.announceDetail`| **Announcement Detail**: Read job requirements, salary/budget in XAF, apply / message author. | Community Service | `community.announcements` | `GET /v1/announcements/:slug`<br/>`POST /v1/announcements/:id/apply` | Public / Bearer | `job.application.submitted` | WhatsApp Direct Chat |
| **49**| `is.vs` | **VS Compare Matrix**: Select 2 or 3 products for head-to-head spec comparison. | Comparison Service | `catalog.products` | `GET /v1/catalog/compare/candidates` | Public | None | None |
| **50**| `is.vsCompare`| **Side-by-Side Spec Table**: View diff highlight comparison matrix (MacBook vs Dell, Canon vs Sony). | Comparison Service | `catalog.products` | `GET /v1/catalog/compare?ids={id1,id2}` | Public | None | JSONB Spec Normalizer |
| **51**| `is.travel` | **Travel & Flight Search**: Search flights (Origin, Destination, Date, Class), view popular getaways. | Travel GDS Gateway | `travel.flight_routes` | `GET /v1/travel/popular-destinations` | Public | `travel.search.executed` | Amadeus / Camair-Co GDS |
| **52**| `is.travelResults`| **Flight Search Results**: Compare airline fares (Camair-Co, Air France), duration, stops, sort filters. | Travel Aggregator Service | `travel.flight_routes` | `GET /v1/travel/flights/search?from=DLA&to=CDG` | Public | None | Airline GDS API |
| **53**| `is.travelDetail`| **Flight Itinerary Detail**: View baggage allowance, transit stops, seat policies, book CTA. | Travel Service | `travel.flight_routes` | `GET /v1/travel/flights/:id` | Public | None | Airline Fare Rules Engine |
| **54**| `is.travelPassenger`| **Passenger Information**: Input passport number, full name, date of birth, contact phone. | Travel Booking Service | `travel.bookings` | `POST /v1/travel/bookings/passengers` | Bearer Token | `travel.passenger.saved` | Passport Validator |
| **55**| `is.travelTicket`| **Apple Wallet Boarding Pass**: View digital boarding pass with QR code, flight number, gate, seat. | Travel Ticketing Service | `travel.bookings` | `GET /v1/travel/tickets/:pnr/pkpass` | Bearer Token | `travel.boarding_pass.issued` | Apple Wallet PKPass Generator |
| **56**| `is.travelBus`| **Intercity VIP Bus Hub**: Book Douala-Yaoundé-Bafoussam lines (General Express, Touristique Express). | Intercity Transit Service | `travel.bus_routes` | `GET /v1/travel/bus/routes?origin=Douala` | Public | None | Regional Bus Operator APIs |
| **57**| `is.travelPackages`| **Vacation Excursion Packages**: Book Kribi Beach & Lobé Falls or Mount Cameroon weekend packages. | Tour Operator Service | `travel.packages` | `GET /v1/travel/packages` | Public | None | Local Tour Guides |
| **58**| `is.travelVisa`| **Visa Concierge Checklist**: Upload Schengen, Dubai, USA visa requirements (Passport, bank statement). | Visa Concierge Service | `travel.visa_applications` | `POST /v1/travel/visa/documents` | Bearer Token | `visa.documents.submitted` | Encrypted S3 Bucket |
