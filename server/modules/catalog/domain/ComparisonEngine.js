/**
 * LOUMOO Comparison Engine
 * Domain Engine for Head-to-Head Product Comparison, Specification Differencing,
 * Deterministic Value Scoring, and Personalized Recommendation Weighting.
 */

const { ValidationError } = require('../../../shared/errors/AppError');

const DEFAULT_PRIORITIES = {
  price: 3,
  performance: 3,
  battery: 3,
  display: 3,
  portability: 3,
  warranty: 3,
  delivery: 3,
  value: 3
};

const SPEC_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: 'layout',
    attributes: [
      { key: 'price', label: 'Price', format: 'currency', winner: 'min' },
      { key: 'rating', label: 'Rating', format: 'rating', winner: 'max' },
      { key: 'merchant', label: 'Primary Seller', format: 'text' },
      { key: 'merchantCity', label: 'Location', format: 'text' },
      { key: 'inStock', label: 'Availability', format: 'boolean', winner: 'max' }
    ]
  },
  {
    id: 'performance',
    title: 'Performance & Architecture',
    icon: 'cpu',
    attributes: [
      { key: 'specs.performance.processor', label: 'Processor / Chip', format: 'text' },
      { key: 'specs.performance.cpuCores', label: 'CPU Cores', format: 'text' },
      { key: 'specs.performance.ram', label: 'Memory (RAM)', format: 'text', numKey: 'specs.performance.ramNumericGb', winner: 'max' },
      { key: 'specs.performance.gpu', label: 'GPU / Graphics', format: 'text' },
      { key: 'specs.performance.performanceClass', label: 'Performance Tier', format: 'text' },
      { key: 'specs.performance.thermal', label: 'Thermal Design', format: 'text' }
    ]
  },
  {
    id: 'display',
    title: 'Display & Visuals',
    icon: 'monitor',
    attributes: [
      { key: 'specs.display.size', label: 'Screen Size', format: 'text', numKey: 'specs.display.sizeNumericInches' },
      { key: 'specs.display.resolution', label: 'Resolution', format: 'text' },
      { key: 'specs.display.refreshRate', label: 'Refresh Rate', format: 'text' },
      { key: 'specs.display.panelType', label: 'Panel Type', format: 'text' },
      { key: 'specs.display.brightness', label: 'Peak Brightness', format: 'text' }
    ]
  },
  {
    id: 'battery',
    title: 'Battery & Power',
    icon: 'battery-charging',
    attributes: [
      { key: 'specs.battery.batteryLife', label: 'Battery Life', format: 'text', numKey: 'specs.battery.batteryLifeHours', winner: 'max' },
      { key: 'specs.battery.capacity', label: 'Battery Capacity', format: 'text' },
      { key: 'specs.battery.fastCharging', label: 'Fast Charging', format: 'text' },
      { key: 'specs.battery.chargerIncluded', label: 'Charger in Box', format: 'text' }
    ]
  },
  {
    id: 'cameraAudio',
    title: 'Camera, Media & Audio',
    icon: 'video',
    attributes: [
      { key: 'specs.cameraAudio.camera', label: 'Camera / Webcam', format: 'text' },
      { key: 'specs.cameraAudio.speakers', label: 'Speaker System', format: 'text' },
      { key: 'specs.cameraAudio.microphones', label: 'Microphone Array', format: 'text' }
    ]
  },
  {
    id: 'build',
    title: 'Build, Materials & Weight',
    icon: 'feather',
    attributes: [
      { key: 'specs.build.weight', label: 'Weight', format: 'text', numKey: 'specs.build.weightNumericKg', winner: 'min' },
      { key: 'specs.build.material', label: 'Chassis Material', format: 'text' },
      { key: 'specs.build.dimensions', label: 'Dimensions', format: 'text' },
      { key: 'specs.build.portabilityIndex', label: 'Portability Index', format: 'text' }
    ]
  },
  {
    id: 'storage',
    title: 'Storage & Expansion',
    icon: 'hard-drive',
    attributes: [
      { key: 'specs.storage.internalStorage', label: 'Storage', format: 'text', numKey: 'specs.storage.storageNumericGb', winner: 'max' },
      { key: 'specs.storage.ssdSpeed', label: 'Storage Speed', format: 'text' },
      { key: 'specs.storage.storageExpandable', label: 'Expandability', format: 'text' }
    ]
  },
  {
    id: 'connectivity',
    title: 'Connectivity & Ports',
    icon: 'wifi',
    attributes: [
      { key: 'specs.connectivity.wifi', label: 'Wi-Fi standard', format: 'text' },
      { key: 'specs.connectivity.bluetooth', label: 'Bluetooth', format: 'text' },
      { key: 'specs.connectivity.ports', label: 'Ports', format: 'text' },
      { key: 'specs.connectivity.headphoneJack', label: 'Headphone Jack', format: 'text' }
    ]
  },
  {
    id: 'commerce',
    title: 'Commerce, Warranty & Escrow',
    icon: 'shield-check',
    attributes: [
      { key: 'specs.commerce.warranty', label: 'Warranty', format: 'text', numKey: 'specs.commerce.warrantyMonths', winner: 'max' },
      { key: 'specs.commerce.deliverySpeed', label: 'Delivery Timeline', format: 'text' },
      { key: 'specs.commerce.escrowTier', label: 'LOUMOO Escrow', format: 'text' },
      { key: 'specs.commerce.returnPolicy', label: 'Return Policy', format: 'text' }
    ]
  }
];

class ComparisonEngine {
  /**
   * Helper to retrieve nested object property by dotted path
   */
  static getNestedVal(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  /**
   * Validates if products can be meaningfully compared
   */
  static validateCompatibility(products) {
    if (!Array.isArray(products) || products.length < 2) {
      return { compatible: false, message: 'Please select at least 2 products to compare.' };
    }
    if (products.length > 4) {
      return { compatible: false, message: 'Comparison is limited to a maximum of 4 products.' };
    }

    const categories = new Set(products.map(p => p.category?.toLowerCase() || 'general'));
    const isSingleCategory = categories.size === 1;

    return {
      compatible: isSingleCategory,
      categories: Array.from(categories),
      warning: !isSingleCategory
        ? 'Selected products belong to different categories. Some specifications may not directly align.'
        : null
    };
  }

  /**
   * Calculates deterministic Value Score (0–100)
   */
  static calculateValueScore(product) {
    if (!product) return 70;
    
    let score = 50;

    // 1. Rating component (up to 20 pts)
    const rating = Number(product.rating) || 4.0;
    score += Math.min(20, Math.round((rating / 5) * 20));

    // 2. Verified Merchant & Escrow bonus (up to 15 pts)
    if (product.verified) score += 8;
    if (product.specs?.commerce?.escrowTier?.includes('Tier 1')) score += 7;

    // 3. Warranty duration bonus (up to 10 pts)
    const warrantyMonths = Number(product.specs?.commerce?.warrantyMonths) || 12;
    score += Math.min(10, Math.round(warrantyMonths * 0.3));

    // 4. Spec completeness bonus (up to 15 pts)
    if (product.specs?.performance?.processor) score += 5;
    if (product.specs?.battery?.batteryLifeHours) score += 5;
    if (product.specs?.display?.resolution) score += 5;

    // 5. Price to performance balance (up to 10 pts)
    const price = Number(product.priceNumeric) || 500000;
    if (price > 0 && price < 800000) score += 10;
    else if (price < 1200000) score += 6;
    else score += 3;

    return Math.min(98, Math.max(60, score));
  }

  /**
   * Identifies all specification differences and winners across candidate products
   */
  static extractMatrixAndDifferences(products) {
    const matrixSections = [];
    const quickDifferences = [];

    for (const section of SPEC_SECTIONS) {
      const sectionRows = [];

      for (const attr of section.attributes) {
        const values = products.map(p => {
          const raw = this.getNestedVal(p, attr.key);
          const num = attr.numKey ? this.getNestedVal(p, attr.numKey) : (attr.key === 'price' ? p.priceNumeric : (attr.key === 'rating' ? p.rating : undefined));
          return {
            productId: p.id,
            display: raw !== undefined && raw !== null ? String(raw) : null,
            numeric: Number.isFinite(num) ? Number(num) : null
          };
        });

        // Filter out attribute if all products have null/undefined
        const hasAnyValue = values.some(v => v.display !== null);
        if (!hasAnyValue) continue;

        // Check if values are different
        const distinctDisplays = new Set(values.map(v => v.display));
        const isDifferent = distinctDisplays.size > 1;

        // Determine winner if applicable
        let winnerProductId = null;
        let isTie = false;

        if (attr.winner && isDifferent) {
          const validNums = values.filter(v => v.numeric !== null);
          if (validNums.length === products.length) {
            if (attr.winner === 'min') {
              const minVal = Math.min(...validNums.map(v => v.numeric));
              const winning = validNums.filter(v => v.numeric === minVal);
              if (winning.length === 1) winnerProductId = winning[0].productId;
              else if (winning.length > 1) isTie = true;
            } else if (attr.winner === 'max') {
              const maxVal = Math.max(...validNums.map(v => v.numeric));
              const winning = validNums.filter(v => v.numeric === maxVal);
              if (winning.length === 1) winnerProductId = winning[0].productId;
              else if (winning.length > 1) isTie = true;
            }
          }
        }

        const row = {
          key: attr.key,
          label: attr.label,
          format: attr.format,
          isDifferent,
          winnerProductId,
          isTie,
          values: values.reduce((acc, v) => {
            acc[v.productId] = v.display;
            return acc;
          }, {})
        };

        sectionRows.push(row);

        if (isDifferent) {
          quickDifferences.push({
            sectionId: section.id,
            sectionTitle: section.title,
            label: attr.label,
            winnerProductId,
            isTie,
            values: row.values
          });
        }
      }

      if (sectionRows.length > 0) {
        matrixSections.push({
          id: section.id,
          title: section.title,
          icon: section.icon,
          rows: sectionRows
        });
      }
    }

    return { matrixSections, quickDifferences };
  }

  /**
   * Calculates Personalized Recommendation based on user priorities
   */
  static calculatePersonalizedRecommendation(products, userPriorities = {}) {
    const priorities = { ...DEFAULT_PRIORITIES, ...userPriorities };

    const scored = products.map(product => {
      let score = 0;
      const reasons = [];

      // 1. Price Priority
      const price = Number(product.priceNumeric) || 1000000;
      const priceWeight = Number(priorities.price) || 3;
      if (price <= 750000) {
        score += priceWeight * 20;
        reasons.push('Lower upfront purchase price');
      } else if (price <= 900000) {
        score += priceWeight * 14;
      } else {
        score += priceWeight * 8;
      }

      // 2. Performance Priority
      const perfWeight = Number(priorities.performance) || 3;
      const ram = product.specs?.performance?.ramNumericGb || 8;
      const cpu = product.specs?.performance?.processor || '';
      if (cpu.includes('M3 Pro') || cpu.includes('i7-13700H') || ram >= 18) {
        score += perfWeight * 22;
        reasons.push('Pro-grade processor & large unified memory');
      } else if (ram >= 16) {
        score += perfWeight * 16;
        reasons.push('16GB RAM for multitasking');
      } else {
        score += perfWeight * 10;
      }

      // 3. Battery Life Priority
      const batteryWeight = Number(priorities.battery) || 3;
      const batteryHours = product.specs?.battery?.batteryLifeHours || 10;
      if (batteryHours >= 18) {
        score += batteryWeight * 20;
        reasons.push('All-day 18+ hours battery endurance');
      } else if (batteryHours >= 14) {
        score += batteryWeight * 14;
      } else {
        score += batteryWeight * 8;
      }

      // 4. Portability / Weight Priority
      const portWeight = Number(priorities.portability) || 3;
      const weightKg = product.specs?.build?.weightNumericKg || 1.8;
      if (weightKg <= 1.25) {
        score += portWeight * 20;
        reasons.push('Featherweight chassis under 1.25 kg');
      } else if (weightKg <= 1.65) {
        score += portWeight * 14;
      } else {
        score += portWeight * 6;
      }

      // 5. Display Quality Priority
      const displayWeight = Number(priorities.display) || 3;
      const refresh = product.specs?.display?.refreshRate || '60 Hz';
      const panel = product.specs?.display?.panelType || '';
      if (refresh.includes('120') || panel.includes('Mini-LED') || panel.includes('OLED')) {
        score += displayWeight * 20;
        reasons.push('Fluid 120Hz ProMotion / OLED high-contrast display');
      } else {
        score += displayWeight * 10;
      }

      // 6. Warranty Priority
      const warrantyWeight = Number(priorities.warranty) || 3;
      const warrantyMonths = product.specs?.commerce?.warrantyMonths || 12;
      if (warrantyMonths >= 24) {
        score += warrantyWeight * 18;
        reasons.push(`${warrantyMonths} months extended warranty coverage`);
      } else {
        score += warrantyWeight * 10;
      }

      // 7. Value For Money
      const valueScore = this.calculateValueScore(product);
      score += (Number(priorities.value) || 3) * (valueScore / 6);

      return {
        productId: product.id,
        title: product.title,
        price: product.price,
        score: Math.round(score),
        reasons: Array.from(new Set(reasons)).slice(0, 3)
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    const runnerUp = scored[1] || null;

    // Match percentage relative to max possible score (~600)
    const matchPercentage = Math.min(99, Math.max(78, Math.round((top.score / 500) * 100)));

    return {
      recommendedProductId: top.productId,
      recommendedTitle: top.title,
      matchPercentage,
      topReasons: top.reasons,
      rankings: scored,
      prioritiesUsed: priorities
    };
  }

  /**
   * Generates Editorial LOUMOO Verdict
   */
  static generateVerdict(products, differences, recommendation) {
    if (products.length === 0) return null;

    // Identify overall strongest product & value winner
    const productsWithValue = products.map(p => ({
      ...p,
      valueScore: this.calculateValueScore(p)
    }));

    const sortedByScore = [...productsWithValue].sort((a, b) => b.valueScore - a.valueScore);
    const sortedByPrice = [...productsWithValue].sort((a, b) => a.priceNumeric - b.priceNumeric);

    const bestValueProduct = sortedByPrice[0];
    const bestPerformanceProduct = productsWithValue.find(p => 
      p.specs?.performance?.ramNumericGb >= 16 || p.specs?.performance?.processor?.includes('Pro')
    ) || sortedByScore[0];

    const bestOverall = recommendation.recommendedProductId
      ? products.find(p => p.id === recommendation.recommendedProductId)
      : sortedByScore[0];

    // Compute price difference if 2 products
    let priceDiffText = null;
    if (products.length >= 2) {
      const p1 = products[0];
      const p2 = products[1];
      const diff = Math.abs(p1.priceNumeric - p2.priceNumeric);
      const cheaper = p1.priceNumeric < p2.priceNumeric ? p1 : p2;
      const formattedDiff = new Intl.NumberFormat('fr-FR').format(diff);
      priceDiffText = `${cheaper.title} saves XAF ${formattedDiff}`;
    }

    return {
      bestOverall: {
        productId: bestOverall.id,
        title: bestOverall.title,
        price: bestOverall.price,
        summary: bestOverall.verdictHighlights?.bestFor || 'Top balanced recommendation for modern workflow.',
        pros: bestOverall.verdictHighlights?.pros || ['High reliability & tested performance', 'Comprehensive ecosystem compatibility']
      },
      bestValue: {
        productId: bestValueProduct.id,
        title: bestValueProduct.title,
        price: bestValueProduct.price,
        savingsText: priceDiffText,
        pros: bestValueProduct.verdictHighlights?.pros || ['Best price-to-performance ratio']
      },
      tradeoffs: products.map(p => ({
        productId: p.id,
        title: p.title,
        pros: p.verdictHighlights?.pros || [],
        cons: p.verdictHighlights?.cons || [],
        bestFor: p.verdictHighlights?.bestFor || 'General use'
      }))
    };
  }

  /**
   * Executes Complete Comparison Pipeline
   */
  static run(products, userPriorities = {}) {
    const compatibility = this.validateCompatibility(products);
    const { matrixSections, quickDifferences } = this.extractMatrixAndDifferences(products);
    const recommendation = this.calculatePersonalizedRecommendation(products, userPriorities);
    const verdict = this.generateVerdict(products, quickDifferences, recommendation);

    const productSummaries = products.map(p => ({
      id: p.id,
      title: p.title,
      brand: p.brand || 'LOUMOO Direct',
      category: p.category,
      subCategory: p.subCategory,
      price: p.price,
      originalPrice: p.originalPrice || null,
      priceNumeric: p.priceNumeric,
      discount: p.discount || null,
      rating: p.rating || 4.5,
      reviewsCount: p.reviewsCount || 0,
      badge: p.badge || null,
      badgeClass: p.badgeClass || null,
      merchant: p.merchant,
      merchantCity: p.merchantCity || 'Douala',
      verified: Boolean(p.verified),
      inStock: p.inStock !== false,
      stockUnits: p.stockUnits || 5,
      valueScore: this.calculateValueScore(p),
      specs: p.specs || {},
      sellers: p.sellers || [
        {
          id: `seller-${p.id}`,
          merchant: p.merchant,
          city: p.merchantCity || 'Douala',
          priceNumeric: p.priceNumeric,
          price: p.price,
          rating: p.rating || 4.8,
          verified: Boolean(p.verified),
          stock: 'In Stock',
          delivery: 'Today in Douala · Free',
          warranty: p.specs?.commerce?.warranty || '12 Months Official',
          escrowTier: 'Tier 1 Full Escrow',
          whatsapp: '+237690123456'
        }
      ]
    }));

    return {
      success: true,
      compatibility,
      productCount: products.length,
      products: productSummaries,
      verdict,
      recommendation,
      quickDifferences,
      matrixSections
    };
  }
}

module.exports = {
  ComparisonEngine,
  DEFAULT_PRIORITIES,
  SPEC_SECTIONS
};
