/**
 * LOUMOO PRODUCTS DATASET — Universal Commerce Catalog & Comparison Engine Dataset
 */
export const products = {
  hotels: [
    {
      id: 'hotel-1',
      title: 'Sawa Luxury Hotel',
      brand: 'Sawa Hotels Group',
      merchant: 'Bonanjo, Douala',
      merchantCity: 'Douala',
      verified: true,
      price: 'XAF 65 000',
      priceNumeric: 65000,
      currency: 'XAF',
      rating: 4.8,
      reviewsCount: 128,
      badge: 'POPULAR',
      badgeClass: 'badge-new',
      category: 'Hotels',
      subCategory: 'Luxury Accommodation',
      imageAspect: '4/3',
      specs: {
        performance: { performanceClass: '5-Star Luxury', thermal: 'Central AC + Climate Control' },
        display: { size: '45 m² Suite', panelType: 'Ocean & Port View', brightness: 'Natural Daylight + Blackout' },
        battery: { batteryLife: '24/7 Power Generator Backup', fastCharging: '100% Uptime Guaranteed' },
        connectivity: { wifi: 'High-speed Fiber Wi-Fi 6', ports: 'Smart TV + HDMI' },
        commerce: { warranty: 'Instant Free Cancellation', deliverySpeed: 'Instant Keycard Check-in', deliveryCity: 'Douala (Bonanjo)', escrowTier: 'Tier 1 Full Escrow' }
      }
    },
    {
      id: 'hotel-2',
      title: 'Résidence Akwa Palm',
      brand: 'Akwa Hospitality',
      merchant: 'Akwa, Douala',
      merchantCity: 'Douala',
      verified: true,
      price: 'XAF 38 500',
      priceNumeric: 38500,
      currency: 'XAF',
      rating: 4.5,
      reviewsCount: 84,
      badge: null,
      category: 'Hotels',
      subCategory: 'Executive Suites',
      imageAspect: '4/3'
    },
    {
      id: 'hotel-3',
      title: 'Mont Fébé Lodge',
      brand: 'Mont Fébé',
      merchant: 'Yaoundé',
      merchantCity: 'Yaoundé',
      verified: true,
      price: 'XAF 52 000',
      priceNumeric: 52000,
      currency: 'XAF',
      rating: 4.6,
      reviewsCount: 96,
      badge: 'DEAL',
      badgeClass: 'badge-sale',
      category: 'Hotels',
      subCategory: 'Hilltop Resort',
      imageAspect: '4/3'
    },
    {
      id: 'hotel-4',
      title: 'Kribi Beach Rooms',
      brand: 'Kribi Ocean Resorts',
      merchant: 'Kribi',
      merchantCity: 'Kribi',
      verified: false,
      price: 'XAF 29 000',
      priceNumeric: 29000,
      currency: 'XAF',
      rating: 4.3,
      reviewsCount: 62,
      badge: null,
      category: 'Hotels',
      subCategory: 'Beachfront Lodge',
      imageAspect: '4/3'
    }
  ],
  electronics: [
    {
      id: 'elec-1',
      title: 'MacBook Air 13" (M2)',
      brand: 'Apple',
      merchant: 'Orca Electronics',
      merchantCity: 'Douala (Akwa)',
      verified: true,
      price: 'XAF 745 000',
      originalPrice: '829 000',
      priceNumeric: 745000,
      currency: 'XAF',
      discount: '-10%',
      rating: 4.9,
      reviewsCount: 218,
      badge: 'POPULAR',
      badgeClass: 'badge-hot',
      category: 'Electronics',
      subCategory: 'Laptops',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 14,
      specs: {
        performance: {
          processor: 'Apple M2 (8-Core CPU)',
          cpuCores: '8 Cores (4 Perf / 4 Eff)',
          ram: '8 GB Unified Memory',
          ramNumericGb: 8,
          gpu: '8-Core GPU',
          performanceClass: 'High Efficiency / Everyday Pro',
          thermal: 'Fanless 100% Silent'
        },
        display: {
          size: '13.6-inch',
          sizeNumericInches: 13.6,
          resolution: '2560 × 1664 Liquid Retina',
          refreshRate: '60 Hz',
          panelType: 'IPS LED Backlit',
          brightness: '500 nits Peak'
        },
        battery: {
          capacity: '52.6 Wh Lithium-Polymer',
          batteryLife: '18 Hours',
          batteryLifeHours: 18,
          fastCharging: 'Fast-charge capable (30W/67W)',
          chargerIncluded: '30W USB-C Adapter Included'
        },
        cameraAudio: {
          camera: '1080p FaceTime HD',
          speakers: 'Four-Speaker Sound System (Spatial Audio)',
          microphones: 'Three-Mic Array with Beamforming'
        },
        build: {
          material: '100% Recycled Aluminum Unibody',
          weight: '1.24 kg',
          weightNumericKg: 1.24,
          dimensions: '1.13 cm × 30.41 cm × 21.5 cm',
          portabilityIndex: 'Ultra Portable (Class Leading)'
        },
        storage: {
          internalStorage: '256 GB PCIe NVMe SSD',
          storageNumericGb: 256,
          storageExpandable: 'No (Cloud / External USB-C)',
          ssdSpeed: 'Up to 2.8 GB/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 6 (802.11ax)',
          bluetooth: 'Bluetooth 5.3',
          ports: '2× Thunderbolt / USB 4, MagSafe 3',
          headphoneJack: '3.5 mm High-Impedance Jack'
        },
        commerce: {
          warranty: '12 Months Official Apple Warranty',
          warrantyMonths: 12,
          deliverySpeed: 'Today (Douala Express) · Free',
          deliveryCity: 'Douala, Yaoundé, Bafoussam',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '7 Days Return & Replacement'
        }
      },
      verdictHighlights: {
        pros: ['Exceptional battery life (18h real-world)', 'Fanless silent operation', 'Featherweight 1.24 kg unibody', 'Unbeatable XAF 745,000 value'],
        cons: ['8GB base RAM limit for heavy 4K timelines', 'External support limited to 1 display'],
        bestFor: 'Students, professionals, writers, coding on-the-go & everyday productivity.'
      },
      sellers: [
        {
          id: 'seller-orca',
          merchant: 'Orca Electronics',
          city: 'Douala (Akwa)',
          priceNumeric: 745000,
          price: 'XAF 745 000',
          rating: 4.9,
          reviewsCount: 1240,
          verified: true,
          stock: 'In Stock (14 Units)',
          delivery: 'Today in Douala · Free',
          warranty: '12 Months Official Apple',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237690123456'
        },
        {
          id: 'seller-digital',
          merchant: 'Digital Corner',
          city: 'Douala (Bonapriso)',
          priceNumeric: 760000,
          price: 'XAF 760 000',
          rating: 4.7,
          reviewsCount: 890,
          verified: true,
          stock: '2 Units Left',
          delivery: 'Tomorrow · XAF 2 000',
          warranty: '12 Months Store Warranty',
          escrowTier: 'Standard Escrow',
          whatsapp: '+237677890123'
        },
        {
          id: 'seller-kamertech',
          merchant: 'KamerTech Direct',
          city: 'Yaoundé (Bastos)',
          priceNumeric: 775000,
          price: 'XAF 775 000',
          rating: 4.8,
          reviewsCount: 430,
          verified: true,
          stock: 'In Stock (5 Units)',
          delivery: 'Same-day Yaoundé · Free',
          warranty: '12 Months Apple Certified',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237699112233'
        }
      ]
    },
    {
      id: 'elec-macbook-pro',
      title: 'MacBook Pro 14" (M3 Pro)',
      brand: 'Apple',
      merchant: 'KamerTech Direct',
      merchantCity: 'Yaoundé (Bastos)',
      verified: true,
      price: 'XAF 1 250 000',
      originalPrice: '1 380 000',
      priceNumeric: 1250000,
      currency: 'XAF',
      discount: '-9%',
      rating: 5.0,
      reviewsCount: 164,
      badge: 'PRO PICK',
      badgeClass: 'badge-hot',
      category: 'Electronics',
      subCategory: 'Laptops',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 8,
      specs: {
        performance: {
          processor: 'Apple M3 Pro (11-Core CPU)',
          cpuCores: '11 Cores (5 Perf / 6 Eff)',
          ram: '18 GB Unified Memory',
          ramNumericGb: 18,
          gpu: '14-Core GPU with Hardware Ray Tracing',
          performanceClass: 'Extreme Pro Workstation',
          thermal: 'Active Dual-Fan High-Efficiency Cooling'
        },
        display: {
          size: '14.2-inch',
          sizeNumericInches: 14.2,
          resolution: '3024 × 1964 Liquid Retina XDR',
          refreshRate: '120 Hz ProMotion',
          panelType: 'Mini-LED with 1,000,000:1 Contrast',
          brightness: '1600 nits Peak HDR / 600 nits SDR'
        },
        battery: {
          capacity: '72.4 Wh Lithium-Polymer',
          batteryLife: '18 Hours',
          batteryLifeHours: 18,
          fastCharging: 'Fast charge up to 96W',
          chargerIncluded: '70W / 96W USB-C Power Adapter Included'
        },
        cameraAudio: {
          camera: '1080p FaceTime HD with Advanced ISP',
          speakers: 'Six-Speaker Sound System with Force-Cancelling Woofers',
          microphones: 'Studio-Quality Three-Mic Array'
        },
        build: {
          material: 'Space Black Anodized Recycled Aluminum',
          weight: '1.61 kg',
          weightNumericKg: 1.61,
          dimensions: '1.55 cm × 31.26 cm × 22.12 cm',
          portabilityIndex: 'Compact Workstation'
        },
        storage: {
          internalStorage: '512 GB High-Speed NVMe SSD',
          storageNumericGb: 512,
          storageExpandable: 'SDXC Card Slot + Thunderbolt 4',
          ssdSpeed: 'Up to 6.2 GB/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 6E (802.11ax)',
          bluetooth: 'Bluetooth 5.3',
          ports: '3× Thunderbolt 4, HDMI 2.1, SDXC slot, MagSafe 3',
          headphoneJack: '3.5 mm High-Impedance Jack'
        },
        commerce: {
          warranty: '12 Months Official Apple Warranty',
          warrantyMonths: 12,
          deliverySpeed: 'Today (Yaoundé & Douala Express)',
          deliveryCity: 'Yaoundé, Douala',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '14 Days Replacement Guarantee'
        }
      },
      verdictHighlights: {
        pros: ['Stunning 120Hz Mini-LED XDR display (1600 nits)', 'Heavy duty M3 Pro with 18GB RAM', 'HDMI 2.1 & full-size SDXC card slot', 'Six-speaker studio audio'],
        cons: ['Higher investment cost (XAF 1,250,000)', 'Heavier at 1.61 kg compared to Air'],
        bestFor: 'Video editors, 3D artists, software architects & intensive heavy multitasking.'
      },
      sellers: [
        {
          id: 'seller-kamertech',
          merchant: 'KamerTech Direct',
          city: 'Yaoundé (Bastos)',
          priceNumeric: 1250000,
          price: 'XAF 1 250 000',
          rating: 4.9,
          reviewsCount: 650,
          verified: true,
          stock: 'In Stock (8 Units)',
          delivery: 'Today in Yaoundé / Tomorrow Douala',
          warranty: '12 Months Apple Official',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237699112233'
        },
        {
          id: 'seller-orca',
          merchant: 'Orca Electronics',
          city: 'Douala (Akwa)',
          priceNumeric: 1280000,
          price: 'XAF 1 280 000',
          rating: 4.9,
          reviewsCount: 1240,
          verified: true,
          stock: 'In Stock (4 Units)',
          delivery: 'Today in Douala · Free',
          warranty: '12 Months Official Apple',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237690123456'
        }
      ]
    },
    {
      id: 'elec-thinkpad',
      title: 'Lenovo ThinkPad X1 Carbon Gen 11',
      brand: 'Lenovo',
      merchant: 'Silicon Central',
      merchantCity: 'Douala (Akwa)',
      verified: true,
      price: 'XAF 890 000',
      originalPrice: '950 000',
      priceNumeric: 890000,
      currency: 'XAF',
      discount: '-6%',
      rating: 4.8,
      reviewsCount: 112,
      badge: 'ENTERPRISE',
      badgeClass: 'badge-new',
      category: 'Electronics',
      subCategory: 'Laptops',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 6,
      specs: {
        performance: {
          processor: 'Intel Core i7-1365U (10 Cores)',
          cpuCores: '10 Cores (2 P-core / 8 E-core)',
          ram: '16 GB LPDDR5',
          ramNumericGb: 16,
          gpu: 'Intel Iris Xe Graphics',
          performanceClass: 'Enterprise Ultrabook',
          thermal: 'Dual Fan Owl-Wing Cooling'
        },
        display: {
          size: '14.0-inch',
          sizeNumericInches: 14.0,
          resolution: '1920 × 1200 IPS Low Power',
          refreshRate: '60 Hz',
          panelType: 'Anti-Glare 100% sRGB',
          brightness: '400 nits'
        },
        battery: {
          capacity: '57 Wh Rapid Charge',
          batteryLife: '14 Hours',
          batteryLifeHours: 14,
          fastCharging: '80% charge in 60 mins (65W)',
          chargerIncluded: '65W USB-C Rapid Charger Included'
        },
        cameraAudio: {
          camera: '1080p FHD + IR Privacy Shutter',
          speakers: 'Dolby Atmos Quad-Speaker System',
          microphones: 'Quad 360-Degree Far-Field Mics'
        },
        build: {
          material: 'Carbon Fiber & Magnesium Alloy (MIL-STD 810H)',
          weight: '1.12 kg',
          weightNumericKg: 1.12,
          dimensions: '1.53 cm × 31.56 cm × 22.25 cm',
          portabilityIndex: 'Extreme Ultra Lightweight'
        },
        storage: {
          internalStorage: '512 GB PCIe Gen4 SSD',
          storageNumericGb: 512,
          storageExpandable: 'M.2 PCIe User Upgradable',
          ssdSpeed: 'Up to 5.0 GB/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 6E (Intel AX211)',
          bluetooth: 'Bluetooth 5.1',
          ports: '2× Thunderbolt 4, 2× USB-A 3.2, HDMI 2.0b, Nano SIM',
          headphoneJack: '3.5 mm Combo Jack'
        },
        commerce: {
          warranty: '36 Months Lenovo Premier On-Site',
          warrantyMonths: 36,
          deliverySpeed: '24 Hours Express',
          deliveryCity: 'Douala, Yaoundé',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '10 Days Return Policy'
        }
      },
      verdictHighlights: {
        pros: ['Lightest laptop at 1.12 kg carbon fiber', 'Unbeatable 3-year enterprise warranty', 'Legendary ThinkPad keyboard & TrackPoint', 'Legacy USB-A & full HDMI built-in'],
        cons: ['Intel Iris Xe graphics weaker for gaming & 3D render', '1080p display resolution lower than Retina'],
        bestFor: 'Corporate executives, enterprise business travelers, developers & Linux enthusiasts.'
      },
      sellers: [
        {
          id: 'seller-silicon',
          merchant: 'Silicon Central',
          city: 'Douala (Akwa)',
          priceNumeric: 890000,
          price: 'XAF 890 000',
          rating: 4.8,
          reviewsCount: 310,
          verified: true,
          stock: 'In Stock (6 Units)',
          delivery: 'Today in Douala · Free',
          warranty: '36 Months Lenovo Premier',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237670001122'
        }
      ]
    },
    {
      id: 'elec-dell-xps',
      title: 'Dell XPS 15 (OLED 3.5K)',
      brand: 'Dell',
      merchant: 'Orca Electronics',
      merchantCity: 'Douala (Akwa)',
      verified: true,
      price: 'XAF 1 180 000',
      priceNumeric: 1180000,
      currency: 'XAF',
      rating: 4.7,
      reviewsCount: 88,
      badge: 'OLED',
      badgeClass: 'badge-new',
      category: 'Electronics',
      subCategory: 'Laptops',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 4,
      specs: {
        performance: {
          processor: 'Intel Core i7-13700H (14 Cores)',
          cpuCores: '14 Cores (6 P-core / 8 E-core)',
          ram: '32 GB DDR5 (Upgradable)',
          ramNumericGb: 32,
          gpu: 'NVIDIA GeForce RTX 4060 8GB',
          performanceClass: 'Creator & Gaming Powerhouse',
          thermal: 'Dual Heat Pipes + Vapor Chamber'
        },
        display: {
          size: '15.6-inch',
          sizeNumericInches: 15.6,
          resolution: '3456 × 2160 InfinityEdge OLED',
          refreshRate: '60 Hz',
          panelType: 'OLED Touchscreen (100% DCI-P3)',
          brightness: '400 nits Pure Black Contrast'
        },
        battery: {
          capacity: '86 Wh Deep Cell',
          batteryLife: '9 Hours',
          batteryLifeHours: 9,
          fastCharging: '130W USB-C ExpressCharge',
          chargerIncluded: '130W USB-C Power Adapter'
        },
        cameraAudio: {
          camera: '720p HD Webcam',
          speakers: 'Studio Quality Waves Nx 3D Quad Speakers',
          microphones: 'Dual Digital Array'
        },
        build: {
          material: 'CNC Machined Aluminum with Carbon Fiber Palmrest',
          weight: '1.92 kg',
          weightNumericKg: 1.92,
          dimensions: '1.80 cm × 34.47 cm × 23.01 cm',
          portabilityIndex: 'Full Size 15" Workstation'
        },
        storage: {
          internalStorage: '1 TB PCIe Gen4 NVMe SSD',
          storageNumericGb: 1024,
          storageExpandable: 'Dual M.2 SSD Slots (Up to 8TB)',
          ssdSpeed: 'Up to 7.0 GB/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 6E (Killer 1675)',
          bluetooth: 'Bluetooth 5.2',
          ports: '2× Thunderbolt 4, 1× USB-C 3.2, SD Card Reader',
          headphoneJack: '3.5 mm Audio Jack'
        },
        commerce: {
          warranty: '24 Months Dell ProSupport',
          warrantyMonths: 24,
          deliverySpeed: '24 Hours Express',
          deliveryCity: 'Douala, Yaoundé',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '7 Days Replacement'
        }
      },
      verdictHighlights: {
        pros: ['Breathtaking 3.5K OLED touchscreen display', 'Dedicated NVIDIA RTX 4060 graphics', 'Upgradable 32GB RAM & dual SSD slots', 'Spacious 15.6-inch creative canvas'],
        cons: ['Shorter battery life (9h) due to RTX GPU & 3.5K OLED', 'Heavier at 1.92 kg'],
        bestFor: 'Graphic designers, architects (AutoCAD/Revit), PC gamers & Windows power users.'
      }
    },
    {
      id: 'elec-phone-iphone',
      title: 'iPhone 15 Pro 256GB',
      brand: 'Apple',
      merchant: 'Orca Electronics',
      merchantCity: 'Douala (Akwa)',
      verified: true,
      price: 'XAF 820 000',
      priceNumeric: 820000,
      currency: 'XAF',
      rating: 4.9,
      reviewsCount: 340,
      badge: 'TITANIUM',
      badgeClass: 'badge-hot',
      category: 'Electronics',
      subCategory: 'Smartphones',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 18,
      specs: {
        performance: {
          processor: 'Apple A17 Pro (3nm)',
          cpuCores: '6 Cores (2 High-Performance / 4 Efficiency)',
          ram: '8 GB RAM',
          ramNumericGb: 8,
          gpu: '6-Core GPU with Hardware Ray Tracing',
          performanceClass: 'Flagship Mobile Gaming & Video'
        },
        display: {
          size: '6.1-inch',
          sizeNumericInches: 6.1,
          resolution: '2556 × 1179 Super Retina XDR',
          refreshRate: '120 Hz ProMotion Always-On',
          panelType: 'OLED Ceramic Shield',
          brightness: '2000 nits Peak Outdoor'
        },
        battery: {
          capacity: '3274 mAh',
          batteryLife: '23 Hours Video Playback',
          batteryLifeHours: 23,
          fastCharging: '50% in 30 mins (20W+)',
          chargerIncluded: 'USB-C Braided Cable (Adapter sold separately)'
        },
        cameraAudio: {
          camera: '48MP Main + 12MP Ultra-Wide + 12MP 3× Telephoto',
          speakers: 'Stereo Spatial Audio Speakers',
          microphones: 'Studio-Grade Mic with Voice Isolation'
        },
        build: {
          material: 'Aerospace-Grade Grade 5 Titanium',
          weight: '187 g',
          weightNumericKg: 0.187,
          dimensions: '14.66 cm × 7.06 cm × 0.825 cm',
          portabilityIndex: 'Compact Pocket Flagship'
        },
        storage: {
          internalStorage: '256 GB NVMe',
          storageNumericGb: 256,
          storageExpandable: 'Direct External SSD ProRes Recording',
          ssdSpeed: 'USB 3.0 up to 10 Gb/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 6E',
          bluetooth: 'Bluetooth 5.3',
          ports: 'USB-C (10 Gbps transfer speeds)',
          headphoneJack: 'USB-C Audio / Wireless'
        },
        commerce: {
          warranty: '12 Months Official Apple Warranty',
          warrantyMonths: 12,
          deliverySpeed: 'Today in Douala · Free Express',
          deliveryCity: 'Douala, Yaoundé, Bafoussam',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '7 Days Return Policy'
        }
      }
    },
    {
      id: 'elec-phone-samsung',
      title: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      merchant: 'Mboppi Mobile',
      merchantCity: 'Douala (Mboppi)',
      verified: true,
      price: 'XAF 890 000',
      priceNumeric: 890000,
      currency: 'XAF',
      rating: 4.9,
      reviewsCount: 290,
      badge: 'GALAXY AI',
      badgeClass: 'badge-hot',
      category: 'Electronics',
      subCategory: 'Smartphones',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 12,
      specs: {
        performance: {
          processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
          cpuCores: '8 Cores Octa-Core',
          ram: '12 GB LPDDR5X',
          ramNumericGb: 12,
          gpu: 'Adreno 750 (Ray Tracing)',
          performanceClass: 'Ultimate Android AI Powerhouse'
        },
        display: {
          size: '6.8-inch',
          sizeNumericInches: 6.8,
          resolution: '3120 × 1440 QHD+ Dynamic AMOLED 2X',
          refreshRate: '120 Hz LTPO (1–120Hz)',
          panelType: 'Gorilla Armor Anti-Reflective',
          brightness: '2600 nits Peak Outdoor'
        },
        battery: {
          capacity: '5000 mAh High Capacity',
          batteryLife: '30 Hours Video Playback',
          batteryLifeHours: 30,
          fastCharging: '45W Super Fast Charging 2.0',
          chargerIncluded: 'Cable included'
        },
        cameraAudio: {
          camera: '200MP Main + 50MP 5× Periscope + 10MP 3× + 12MP Ultra-Wide',
          speakers: 'Stereo AKG Tuned with Dolby Atmos',
          microphones: 'Triple Microphones with AI Noise Cancellation'
        },
        build: {
          material: 'Titanium Shield with Integrated S-Pen Stylus',
          weight: '232 g',
          weightNumericKg: 0.232,
          dimensions: '16.23 cm × 7.90 cm × 0.86 cm',
          portabilityIndex: 'Large Note-Taking Flagship'
        },
        storage: {
          internalStorage: '512 GB UFS 4.0',
          storageNumericGb: 512,
          storageExpandable: 'No',
          ssdSpeed: 'UFS 4.0 up to 4.2 GB/s'
        },
        connectivity: {
          wifi: 'Wi-Fi 7 Ready (802.11be)',
          bluetooth: 'Bluetooth 5.3',
          ports: 'USB-C 3.2 Gen 1 (DisplayPort Output)',
          headphoneJack: 'USB-C Audio / Wireless'
        },
        commerce: {
          warranty: '24 Months Samsung Official Warranty',
          warrantyMonths: 24,
          deliverySpeed: 'Today in Douala · Free Express',
          deliveryCity: 'Douala, Yaoundé',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '7 Days Replacement'
        }
      }
    },
    {
      id: 'elec-2',
      title: 'Sony WH-1000XM5',
      brand: 'Sony',
      merchant: 'Digital Corner',
      merchantCity: 'Douala (Bonapriso)',
      verified: true,
      price: 'XAF 189 000',
      priceNumeric: 189000,
      currency: 'XAF',
      rating: 4.7,
      reviewsCount: 142,
      badge: 'NOISE CANCEL',
      badgeClass: 'badge-new',
      category: 'Electronics',
      subCategory: 'Audio & Headphones',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 15,
      specs: {
        performance: {
          processor: 'Integrated Processor V1 + HD QN1',
          performanceClass: 'Industry-Leading Active Noise Cancellation'
        },
        battery: {
          capacity: 'Lithium-Ion Battery',
          batteryLife: '30 Hours with ANC On (40h ANC Off)',
          batteryLifeHours: 30,
          fastCharging: '3 mins charge = 3 hours playback'
        },
        cameraAudio: {
          speakers: '30mm Carbon Fiber Precision Drivers',
          microphones: '8 Microphones with AI Beamforming'
        },
        build: {
          material: 'Soft Fit Leather & Lightweight Synthetic',
          weight: '250 g',
          weightNumericKg: 0.250,
          portabilityIndex: 'Foldable Travel Headphone'
        },
        connectivity: {
          bluetooth: 'Bluetooth 5.2 (LDAC / AAC / SBC / Multipoint)',
          ports: 'USB-C Charging, 3.5mm Audio Cable Included',
          headphoneJack: '3.5mm Detachable Cable'
        },
        commerce: {
          warranty: '12 Months Official Sony Warranty',
          warrantyMonths: 12,
          deliverySpeed: 'Today in Douala',
          deliveryCity: 'Douala, Yaoundé',
          escrowTier: 'Tier 1 Full Escrow',
          returnPolicy: '7 Days Return'
        }
      }
    },
    {
      id: 'elec-3',
      title: 'Samsung A55 256GB',
      brand: 'Samsung',
      merchant: 'Mboppi Mobile',
      merchantCity: 'Douala (Mboppi)',
      verified: true,
      price: 'XAF 245 000',
      priceNumeric: 245000,
      currency: 'XAF',
      rating: 4.4,
      reviewsCount: 98,
      badge: 'BEST VALUE',
      badgeClass: 'badge-sale',
      category: 'Electronics',
      subCategory: 'Smartphones',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 25
    },
    {
      id: 'elec-4',
      title: 'Anker 737 Power Bank (24,000mAh)',
      brand: 'Anker',
      merchant: 'Orca Electronics',
      merchantCity: 'Douala (Akwa)',
      verified: true,
      price: 'XAF 62 000',
      priceNumeric: 62000,
      currency: 'XAF',
      rating: 4.6,
      reviewsCount: 75,
      badge: '140W FAST',
      badgeClass: 'badge-new',
      category: 'Electronics',
      subCategory: 'Accessories',
      imageAspect: '4/3',
      inStock: true,
      stockUnits: 30
    }
  ],
  universities: [
    {
      id: 'edu-1',
      title: 'Institut Saint Jean',
      brand: 'ISJ Cameroon',
      merchant: 'Admissions open',
      merchantCity: 'Yaoundé',
      price: 'From XAF 450k',
      priceNumeric: 450000,
      currency: 'XAF',
      rating: 4.7,
      status: '✓ Verified',
      category: 'Education'
    },
    {
      id: 'edu-2',
      title: 'ICT University',
      brand: 'ICT University Foundation',
      merchant: 'Yaoundé campus',
      merchantCity: 'Yaoundé',
      price: 'From XAF 620k',
      priceNumeric: 620000,
      currency: 'XAF',
      rating: 4.6,
      status: '✓ Verified',
      category: 'Education'
    },
    {
      id: 'edu-3',
      title: 'Ecole 241 Coding',
      brand: '241 Tech',
      merchant: '6-month bootcamp',
      merchantCity: 'Douala',
      price: 'From XAF 180k',
      priceNumeric: 180000,
      currency: 'XAF',
      rating: 4.8,
      category: 'Education'
    },
    {
      id: 'edu-4',
      title: 'Alliance Française',
      brand: 'Alliance Française',
      merchant: 'Language courses',
      merchantCity: 'Douala',
      price: 'From XAF 45k',
      priceNumeric: 45000,
      currency: 'XAF',
      rating: 4.5,
      category: 'Education'
    }
  ],
  services: [
    {
      id: 'srv-1',
      title: 'Event photography',
      brand: 'Brice N. Studio',
      merchant: 'Brice N. · Freelancer',
      merchantCity: 'Douala',
      price: 'XAF 80 000/day',
      priceNumeric: 80000,
      currency: 'XAF',
      rating: 5.0,
      category: 'Services'
    },
    {
      id: 'srv-2',
      title: 'Solar installation',
      brand: 'Volt Services Sarl',
      merchant: 'Volt Services Sarl',
      merchantCity: 'Douala & Yaoundé',
      price: 'Quote on request',
      priceNumeric: 350000,
      currency: 'XAF',
      status: '✓ Verified',
      category: 'Services'
    }
  ]
};
